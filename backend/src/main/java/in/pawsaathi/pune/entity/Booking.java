package in.pawsaathi.pune.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private AppUser customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "caretaker_id", nullable = false)
    private AppUser caretaker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceCatalogItem service;

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(length = 250)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Booking() {}

    public Booking(
            AppUser customer,
            AppUser caretaker,
            Pet pet,
            ServiceCatalogItem service,
            LocalDateTime startsAt,
            LocalDateTime endsAt,
            BigDecimal hourlyRate,
            String location,
            String notes) {
        this.customer = customer;
        this.caretaker = caretaker;
        this.pet = pet;
        this.service = service;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.hourlyRate = hourlyRate;
        this.location = location;
        this.notes = notes;
        this.status = BookingStatus.PENDING_PAYMENT;
    }

    public void transitionTo(BookingStatus status) {
        this.status = status;
    }

    public void transitionTo(BookingStatus status, String cancellationReason) {
        this.status = status;
        if (status == BookingStatus.CANCELLED || status == BookingStatus.REJECTED) {
            this.cancellationReason = cancellationReason;
        }
    }

    public Long getId() {
        return id;
    }

    public AppUser getCustomer() {
        return customer;
    }

    public AppUser getCaretaker() {
        return caretaker;
    }

    public Pet getPet() {
        return pet;
    }

    public ServiceCatalogItem getService() {
        return service;
    }

    public LocalDateTime getStartsAt() {
        return startsAt;
    }

    public LocalDateTime getEndsAt() {
        return endsAt;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public String getLocation() {
        return location;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
