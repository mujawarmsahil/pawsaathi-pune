package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.ServiceArea;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceAreaRepository extends JpaRepository<ServiceArea, Long> {
    List<ServiceArea> findByActiveTrueOrderByNameAsc();

    Optional<ServiceArea> findByNameIgnoreCaseAndActiveTrue(String name);
}
