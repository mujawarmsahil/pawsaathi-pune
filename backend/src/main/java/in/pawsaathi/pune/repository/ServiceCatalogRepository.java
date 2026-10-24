package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.ServiceCatalogItem;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalogItem, Long> {
    Optional<ServiceCatalogItem> findByIdAndActiveTrue(Long id);

    List<ServiceCatalogItem> findByActiveTrueOrderByIdAsc();

    Optional<ServiceCatalogItem> findByNameIgnoreCaseAndActiveTrue(String name);
}
