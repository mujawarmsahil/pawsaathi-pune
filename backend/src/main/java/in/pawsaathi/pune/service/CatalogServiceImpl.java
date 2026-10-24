package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.ServiceAreaResponse;
import in.pawsaathi.pune.model.ServiceCatalogResponse;
import in.pawsaathi.pune.repository.ServiceAreaRepository;
import in.pawsaathi.pune.repository.ServiceCatalogRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatalogServiceImpl implements CatalogService {
    private final ServiceCatalogRepository services;
    private final ServiceAreaRepository areas;

    public CatalogServiceImpl(
            ServiceCatalogRepository services, ServiceAreaRepository areas) {
        this.services = services;
        this.areas = areas;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceCatalogResponse> services() {
        return services.findByActiveTrueOrderByIdAsc().stream()
                .map(
                        service ->
                                new ServiceCatalogResponse(
                                        service.getId(),
                                        service.getName(),
                                        service.getDescription(),
                                        service.getDefaultHourlyRate()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceAreaResponse> areas() {
        return areas.findByActiveTrueOrderByNameAsc().stream()
                .map(area -> new ServiceAreaResponse(area.getId(), area.getName(), area.getCity()))
                .toList();
    }
}
