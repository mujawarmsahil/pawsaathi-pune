package in.pawsaathi.pune.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "caretaker_availability")
public class CaretakerAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "caretaker_id", nullable = false)
    private AppUser caretaker;

    @Column(name = "weekday")
    private Integer weekday;

    @Column(name = "starts_at", nullable = false)
    private LocalTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private LocalTime endsAt;

    @Column(name = "unavailable_date")
    private LocalDate unavailableDate;

    @Column(name = "is_available", nullable = false)
    private boolean available;

    protected CaretakerAvailability() {}

    public static CaretakerAvailability recurring(
            AppUser caretaker, int weekday, LocalTime startsAt, LocalTime endsAt) {
        var slot = new CaretakerAvailability();
        slot.caretaker = caretaker;
        slot.weekday = weekday;
        slot.startsAt = startsAt;
        slot.endsAt = endsAt;
        slot.available = true;
        return slot;
    }

    public Long getId() {
        return id;
    }

    public Integer getWeekday() {
        return weekday;
    }

    public LocalTime getStartsAt() {
        return startsAt;
    }

    public LocalTime getEndsAt() {
        return endsAt;
    }
}
