package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.ServiceAreaResponse;
import in.pawsaathi.pune.model.ServiceCatalogResponse;

import java.util.List;

public interface CatalogService {
    List<ServiceCatalogResponse> services();

    List<ServiceAreaResponse> areas();
}
