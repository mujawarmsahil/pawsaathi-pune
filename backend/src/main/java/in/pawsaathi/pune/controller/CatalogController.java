package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.ServiceAreaResponse;
import in.pawsaathi.pune.model.ServiceCatalogResponse;
import in.pawsaathi.pune.service.CatalogService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/services")
    public List<ServiceCatalogResponse> services() {
        return catalog.services();
    }

    @GetMapping("/areas")
    public List<ServiceAreaResponse> areas() {
        return catalog.areas();
    }
}
