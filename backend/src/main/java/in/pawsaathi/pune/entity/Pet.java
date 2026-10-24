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
import jakarta.persistence.Version;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pets")
public class Pet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private AppUser owner;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 40)
    private String species;

    @Column(length = 80)
    private String breed;

    @Column(name = "age_years", precision = 4, scale = 1)
    private BigDecimal ageYears;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Pet() {}

    public Pet(
            AppUser owner,
            String name,
            String species,
            String breed,
            BigDecimal ageYears,
            String notes) {
        this.owner = owner;
        this.name = name;
        this.species = species;
        this.breed = breed;
        this.ageYears = ageYears;
        this.notes = notes;
    }

    public void update(
            String name, String species, String breed, BigDecimal ageYears, String notes) {
        this.name = name;
        this.species = species;
        this.breed = breed;
        this.ageYears = ageYears;
        this.notes = notes;
    }

    public void softDelete(Instant deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSpecies() {
        return species;
    }

    public String getBreed() {
        return breed;
    }

    public BigDecimal getAgeYears() {
        return ageYears;
    }

    public String getNotes() {
        return notes;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }
}
