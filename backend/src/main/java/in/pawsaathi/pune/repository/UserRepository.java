package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.AppUser;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query(
            "SELECT COUNT(u) FROM AppUser u"
                    + " WHERE u.role.name=:roleName AND u.deletedAt IS NULL")
    long countByRoleName(@Param("roleName") String roleName);

    @Query(
            "SELECT COUNT(profile) FROM CaretakerProfile profile"
                    + " WHERE profile.user.id=:userId AND profile.approvalStatus='APPROVED'")
    long countApprovedCaretakers(@Param("userId") long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM AppUser u WHERE u.id=:id")
    Optional<AppUser> findLockedById(@Param("id") long id);
}
