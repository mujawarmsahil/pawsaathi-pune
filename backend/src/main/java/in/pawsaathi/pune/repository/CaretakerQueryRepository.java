package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.model.AdminCaretakerDetailResponse;
import in.pawsaathi.pune.model.CaretakerAreaResponse;
import in.pawsaathi.pune.model.CaretakerCandidateResponse;
import in.pawsaathi.pune.model.CaretakerDetailResponse;
import in.pawsaathi.pune.model.CaretakerProfileResponse;
import in.pawsaathi.pune.model.CaretakerServiceResponse;
import in.pawsaathi.pune.model.CaretakerSummaryResponse;
import in.pawsaathi.pune.model.ReviewResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public class CaretakerQueryRepository {
    private final JdbcTemplate jdbc;

    public CaretakerQueryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<CaretakerSummaryResponse> searchApproved(Long serviceId, String area) {
        String sql =
                """
                SELECT u.id,u.name,cp.bio,cp.experience_years,cp.hourly_rate,
                  COALESCE((SELECT GROUP_CONCAT(sa.name ORDER BY sa.name SEPARATOR ', ')
                    FROM caretaker_service_areas csa
                    JOIN service_areas sa ON sa.id=csa.area_id
                    WHERE csa.caretaker_id=u.id),'') service_areas,
                  cp.photo_url,cp.languages,
                  (SELECT COUNT(*) FROM reviews r
                    WHERE r.caretaker_id=u.id AND r.moderation_status='APPROVED') review_count,
                  (SELECT AVG(r.rating) FROM reviews r
                    WHERE r.caretaker_id=u.id AND r.moderation_status='APPROVED') rating
                FROM users u
                JOIN roles ro ON ro.id=u.role_id
                JOIN caretaker_profiles cp ON cp.user_id=u.id
                WHERE ro.name='CARETAKER' AND u.status='ACTIVE' AND cp.is_verified=1
                  AND cp.approval_status='APPROVED'
                  AND (? IS NULL OR EXISTS(
                    SELECT 1 FROM caretaker_services cs
                    WHERE cs.caretaker_id=u.id AND cs.service_id=?))
                  AND (? IS NULL OR EXISTS(
                    SELECT 1 FROM caretaker_service_areas csa
                    JOIN service_areas sa ON sa.id=csa.area_id
                    WHERE csa.caretaker_id=u.id AND LOWER(sa.name)=LOWER(?)))
                ORDER BY rating DESC,u.name
                """;
        return jdbc.query(
                sql,
                (rs, rowNum) ->
                        new CaretakerSummaryResponse(
                                rs.getLong("id"),
                                rs.getString("name"),
                                rs.getString("bio"),
                                rs.getBigDecimal("experience_years"),
                                rs.getBigDecimal("hourly_rate"),
                                rs.getString("service_areas"),
                                rs.getString("photo_url"),
                                rs.getString("languages"),
                                rs.getLong("review_count"),
                                rs.getBigDecimal("rating")),
                serviceId,
                serviceId,
                area,
                area);
    }

    public Optional<CaretakerDetailResponse> findApproved(long caretakerId) {
        String sql =
                """
                SELECT u.id,u.name,cp.bio,cp.experience_years,cp.hourly_rate,
                  COALESCE((SELECT GROUP_CONCAT(sa.name ORDER BY sa.name SEPARATOR ', ')
                    FROM caretaker_service_areas csa
                    JOIN service_areas sa ON sa.id=csa.area_id
                    WHERE csa.caretaker_id=u.id),'') service_areas,
                  cp.photo_url,cp.languages
                FROM users u
                JOIN roles ro ON ro.id=u.role_id
                JOIN caretaker_profiles cp ON cp.user_id=u.id
                WHERE u.id=? AND ro.name='CARETAKER' AND u.status='ACTIVE'
                  AND u.deleted_at IS NULL AND cp.is_verified=1
                  AND cp.approval_status='APPROVED'
                """;
        Optional<CaretakerDetailResponse> profile =
                jdbc.query(
                                sql,
                                (rs, rowNum) ->
                                        new CaretakerDetailResponse(
                                                rs.getLong("id"),
                                                rs.getString("name"),
                                                rs.getString("bio"),
                                                rs.getBigDecimal("experience_years"),
                                                rs.getBigDecimal("hourly_rate"),
                                                rs.getString("service_areas"),
                                                rs.getString("photo_url"),
                                                rs.getString("languages"),
                                                List.of(),
                                                List.of(),
                                                BigDecimal.ZERO,
                                                0),
                                caretakerId)
                        .stream()
                        .findFirst();
        if (profile.isEmpty()) {
            return Optional.empty();
        }
        List<CaretakerServiceResponse> services =
                jdbc.query(
                        """
                        SELECT s.id,s.name,s.description,cs.hourly_rate
                        FROM caretaker_services cs
                        JOIN services s ON s.id=cs.service_id
                        WHERE cs.caretaker_id=? AND s.is_active=1
                        ORDER BY s.name
                        """,
                        (rs, rowNum) ->
                                new CaretakerServiceResponse(
                                        rs.getLong("id"),
                                        rs.getString("name"),
                                        rs.getString("description"),
                                        rs.getBigDecimal("hourly_rate")),
                        caretakerId);
        List<CaretakerAreaResponse> areas =
                jdbc.query(
                        """
                        SELECT sa.id,sa.name,sa.city
                        FROM caretaker_service_areas csa
                        JOIN service_areas sa ON sa.id=csa.area_id
                        WHERE csa.caretaker_id=? AND sa.is_active=1
                        ORDER BY sa.name
                        """,
                        (rs, rowNum) ->
                                new CaretakerAreaResponse(
                                        rs.getLong("id"),
                                        rs.getString("name"),
                                        rs.getString("city")),
                        caretakerId);
        Rating rating =
                jdbc.queryForObject(
                        """
                        SELECT COALESCE(AVG(rating),0) rating,COUNT(*) review_count
                        FROM reviews WHERE caretaker_id=? AND moderation_status='APPROVED'
                        """,
                        (rs, rowNum) ->
                                new Rating(
                                        rs.getBigDecimal("rating"), rs.getLong("review_count")),
                        caretakerId);
        CaretakerDetailResponse found = profile.get();
        return Optional.of(
                new CaretakerDetailResponse(
                        found.id(),
                        found.name(),
                        found.bio(),
                        found.experienceYears(),
                        found.hourlyRate(),
                        found.serviceAreas(),
                        found.photoUrl(),
                        found.languages(),
                        services,
                        areas,
                        rating.rating(),
                        rating.reviewCount()));
    }

    public Optional<AdminCaretakerDetailResponse> findAdminDetail(long caretakerId) {
        String sql =
                """
                SELECT u.id,u.name,u.email,u.phone,u.created_at,
                  cp.bio,cp.experience_years,cp.hourly_rate,
                  COALESCE((SELECT GROUP_CONCAT(sa.name ORDER BY sa.name SEPARATOR ', ')
                    FROM caretaker_service_areas csa
                    JOIN service_areas sa ON sa.id=csa.area_id
                    WHERE csa.caretaker_id=u.id),'') service_areas,
                  cp.photo_url,cp.languages,cp.approval_status,cp.is_verified,cp.updated_at
                FROM users u
                JOIN roles ro ON ro.id=u.role_id
                JOIN caretaker_profiles cp ON cp.user_id=u.id
                WHERE u.id=? AND ro.name='CARETAKER' AND u.deleted_at IS NULL
                """;
        Optional<AdminCaretakerDetailResponse> base =
                jdbc.query(
                                sql,
                                (rs, rowNum) ->
                                        new AdminCaretakerDetailResponse(
                                                rs.getLong("id"),
                                                rs.getString("name"),
                                                rs.getString("email"),
                                                rs.getString("phone"),
                                                rs.getString("photo_url"),
                                                rs.getString("bio"),
                                                rs.getBigDecimal("experience_years"),
                                                rs.getBigDecimal("hourly_rate"),
                                                rs.getString("service_areas"),
                                                rs.getString("languages"),
                                                rs.getString("approval_status"),
                                                rs.getBoolean("is_verified"),
                                                rs.getTimestamp("created_at").toInstant(),
                                                rs.getTimestamp("updated_at").toInstant(),
                                                BigDecimal.ZERO,
                                                0,
                                                List.of(),
                                                List.of(),
                                                List.of()),
                                caretakerId)
                        .stream()
                        .findFirst();
        if (base.isEmpty()) {
            return Optional.empty();
        }
        List<CaretakerServiceResponse> services =
                jdbc.query(
                        """
                        SELECT s.id,s.name,s.description,cs.hourly_rate
                        FROM caretaker_services cs
                        JOIN services s ON s.id=cs.service_id
                        WHERE cs.caretaker_id=? AND s.is_active=1
                        ORDER BY s.name
                        """,
                        (rs, rowNum) ->
                                new CaretakerServiceResponse(
                                        rs.getLong("id"),
                                        rs.getString("name"),
                                        rs.getString("description"),
                                        rs.getBigDecimal("hourly_rate")),
                        caretakerId);
        List<CaretakerAreaResponse> areas =
                jdbc.query(
                        """
                        SELECT sa.id,sa.name,sa.city
                        FROM caretaker_service_areas csa
                        JOIN service_areas sa ON sa.id=csa.area_id
                        WHERE csa.caretaker_id=? AND sa.is_active=1
                        ORDER BY sa.name
                        """,
                        (rs, rowNum) ->
                                new CaretakerAreaResponse(
                                        rs.getLong("id"),
                                        rs.getString("name"),
                                        rs.getString("city")),
                        caretakerId);
        List<ReviewResponse> reviews =
                jdbc.query(
                        """
                        SELECT r.id,r.rating,r.comment,r.moderation_status,r.booking_id,
                          author.name author,caretaker.name caretaker,r.created_at
                        FROM reviews r
                        JOIN users author ON author.id=r.author_id
                        JOIN users caretaker ON caretaker.id=r.caretaker_id
                        WHERE r.caretaker_id=?
                        ORDER BY r.created_at DESC
                        """,
                        (rs, rowNum) ->
                                new ReviewResponse(
                                        rs.getLong("id"),
                                        rs.getInt("rating"),
                                        rs.getString("comment"),
                                        rs.getString("moderation_status"),
                                        rs.getLong("booking_id"),
                                        rs.getString("author"),
                                        rs.getString("caretaker"),
                                        rs.getTimestamp("created_at").toInstant()),
                        caretakerId);
        Rating rating =
                jdbc.queryForObject(
                        """
                        SELECT COALESCE(AVG(rating),0) rating,COUNT(*) review_count
                        FROM reviews WHERE caretaker_id=? AND moderation_status='APPROVED'
                        """,
                        (rs, rowNum) ->
                                new Rating(
                                        rs.getBigDecimal("rating"), rs.getLong("review_count")),
                        caretakerId);
        AdminCaretakerDetailResponse found = base.get();
        return Optional.of(
                new AdminCaretakerDetailResponse(
                        found.id(),
                        found.name(),
                        found.email(),
                        found.phone(),
                        found.photoUrl(),
                        found.bio(),
                        found.experienceYears(),
                        found.hourlyRate(),
                        found.serviceAreas(),
                        found.languages(),
                        found.approvalStatus(),
                        found.verified(),
                        found.registeredAt(),
                        found.updatedAt(),
                        rating.rating(),
                        rating.reviewCount(),
                        services,
                        areas,
                        reviews));
    }

    public Optional<CaretakerProfileResponse> findProfile(long userId) {
        String sql =
                """
                SELECT cp.id,cp.user_id,cp.bio,cp.experience_years,cp.hourly_rate,
                  COALESCE((SELECT GROUP_CONCAT(sa.name ORDER BY sa.name SEPARATOR ', ')
                    FROM caretaker_service_areas csa
                    JOIN service_areas sa ON sa.id=csa.area_id
                    WHERE csa.caretaker_id=cp.user_id),'') service_areas,
                  cp.photo_url,cp.languages,
                  COALESCE((SELECT GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ', ')
                    FROM caretaker_services cs
                    JOIN services s ON s.id=cs.service_id
                    WHERE cs.caretaker_id=cp.user_id),'') service_types,
                  cp.approval_status,cp.is_verified
                FROM caretaker_profiles cp
                WHERE cp.user_id=?
                """;
        return jdbc.query(
                        sql,
                        (rs, rowNum) ->
                                new CaretakerProfileResponse(
                                        rs.getLong("id"),
                                        rs.getLong("user_id"),
                                        rs.getString("bio"),
                                        rs.getBigDecimal("experience_years"),
                                        rs.getBigDecimal("hourly_rate"),
                                        rs.getString("service_areas"),
                                        rs.getString("photo_url"),
                                        rs.getString("languages"),
                                        rs.getString("service_types"),
                                        rs.getString("approval_status"),
                                        rs.getBoolean("is_verified")),
                        userId)
                .stream()
                .findFirst();
    }

    public List<CaretakerCandidateResponse> adminCandidates() {
        return jdbc.query(
                """
                SELECT u.id,u.name,u.email,cp.photo_url,cp.hourly_rate,
                  COALESCE((SELECT GROUP_CONCAT(sa.name ORDER BY sa.name SEPARATOR ', ')
                    FROM caretaker_service_areas csa
                    JOIN service_areas sa ON sa.id=csa.area_id
                    WHERE csa.caretaker_id=u.id),'') service_areas,
                  cp.approval_status,cp.is_verified
                FROM users u
                JOIN caretaker_profiles cp ON cp.user_id=u.id
                ORDER BY cp.approval_status,u.created_at DESC
                """,
                (rs, rowNum) ->
                        new CaretakerCandidateResponse(
                                rs.getLong("id"),
                                rs.getString("name"),
                                rs.getString("email"),
                                rs.getString("photo_url"),
                                rs.getBigDecimal("hourly_rate"),
                                rs.getString("service_areas"),
                                rs.getString("approval_status"),
                                rs.getBoolean("is_verified")));
    }

    public void replaceAreas(long caretakerId, List<Long> areaIds) {
        jdbc.update("DELETE FROM caretaker_service_areas WHERE caretaker_id=?", caretakerId);
        if (areaIds.isEmpty()) {
            return;
        }
        jdbc.batchUpdate(
                "INSERT INTO caretaker_service_areas(caretaker_id,area_id) VALUES(?,?)",
                areaIds,
                areaIds.size(),
                (statement, areaId) -> {
                    statement.setLong(1, caretakerId);
                    statement.setLong(2, areaId);
                });
    }

    public void replaceServices(long caretakerId, List<Long> serviceIds, BigDecimal hourlyRate) {
        jdbc.update("DELETE FROM caretaker_services WHERE caretaker_id=?", caretakerId);
        if (serviceIds.isEmpty()) {
            return;
        }
        jdbc.batchUpdate(
                "INSERT INTO caretaker_services(caretaker_id,service_id,hourly_rate)"
                        + " VALUES(?,?,?)",
                serviceIds,
                serviceIds.size(),
                (statement, serviceId) -> {
                    statement.setLong(1, caretakerId);
                    statement.setLong(2, serviceId);
                    statement.setBigDecimal(3, hourlyRate);
                });
    }

    private record Rating(BigDecimal rating, long reviewCount) {}
}
