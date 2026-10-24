package in.pawsaathi.pune.model;

import java.math.BigDecimal;

public record ServiceCatalogResponse(
        long id, String name, String description, BigDecimal hourlyRate) {}
