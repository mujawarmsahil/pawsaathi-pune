package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.RefreshToken;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM RefreshToken t JOIN FETCH t.user WHERE t.tokenHash=:tokenHash")
    Optional<RefreshToken> findLockedByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query(
            "UPDATE RefreshToken t SET t.revokedAt=:revokedAt"
                    + " WHERE t.tokenHash=:tokenHash AND t.revokedAt IS NULL")
    int revokeByTokenHash(
            @Param("tokenHash") String tokenHash, @Param("revokedAt") Instant revokedAt);

    @Modifying
    @Query(
            "UPDATE RefreshToken t SET t.revokedAt=:revokedAt"
                    + " WHERE t.user.id=:userId AND t.revokedAt IS NULL")
    int revokeAllForUser(@Param("userId") long userId, @Param("revokedAt") Instant revokedAt);
}
