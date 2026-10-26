package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.Pet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, Long> {
    List<Pet> findByOwnerIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long ownerId);

    List<Pet> findByOwnerIdInAndDeletedAtIsNullOrderByName(List<Long> ownerIds);

    Optional<Pet> findByIdAndOwnerIdAndDeletedAtIsNull(Long id, Long ownerId);
}
