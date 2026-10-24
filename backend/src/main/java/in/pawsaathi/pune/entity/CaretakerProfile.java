package in.pawsaathi.pune.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "caretaker_profiles")
@Getter
@Setter
@NoArgsConstructor
public class CaretakerProfile {
    public static final BigDecimal DEFAULT_HOURLY_RATE = new BigDecimal("399.00");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "approval_status", nullable = false, length = 24)
    private String approvalStatus = "PENDING";

    @Column(name = "is_verified", nullable = false)
    private boolean verified;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "experience_years", precision = 4, scale = 1)
    private BigDecimal experienceYears;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(length = 250)
    private String languages;

    @Column(name = "service_types", length = 500)
    private String serviceTypes;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    public static CaretakerProfile pending(AppUser user) {
        CaretakerProfile profile = new CaretakerProfile();
        profile.user = user;
        profile.hourlyRate = DEFAULT_HOURLY_RATE;
        profile.approvalStatus = "PENDING";
        profile.verified = false;
        return profile;
    }

    public void review(String status) {
        this.approvalStatus = status;
        this.verified = "APPROVED".equals(status);
    }
}
