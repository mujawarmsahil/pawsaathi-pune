package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.CaretakerProfile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface CaretakerProfileRepository extends JpaRepository<CaretakerProfile, Long> {
    Optional<CaretakerProfile> findByUserId(long userId);

    long countByApprovalStatus(String approvalStatus);

    @Query(
            value =
                    """
                    SELECT cp.hourly_rate
                    FROM caretaker_profiles cp
                    JOIN users u ON u.id=cp.user_id
                    JOIN caretaker_services cs ON cs.caretaker_id=cp.user_id
                    WHERE cp.user_id=:caretakerId
                      AND cs.service_id=:serviceId
                      AND cp.approval_status='APPROVED'
                      AND cp.is_verified=TRUE
                      AND u.status='ACTIVE'
                      AND u.deleted_at IS NULL
                    """,
            nativeQuery = true)
    Optional<BigDecimal> findApprovedHourlyRate(
            @Param("caretakerId") long caretakerId, @Param("serviceId") long serviceId);

    @Query(
            value =
                    """
                    SELECT COUNT(*)
                    FROM caretaker_service_areas csa
                    JOIN service_areas sa ON sa.id=csa.area_id AND sa.is_active=TRUE
                    WHERE csa.caretaker_id=:caretakerId
                      AND LOCATE(LOWER(sa.name), LOWER(:location)) > 0
                    """,
            nativeQuery = true)
    long countSupportedAreasForLocation(
            @Param("caretakerId") long caretakerId, @Param("location") String location);
}
