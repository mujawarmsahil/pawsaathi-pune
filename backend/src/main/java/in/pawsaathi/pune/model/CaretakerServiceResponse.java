package in.pawsaathi.pune.model;

import java.math.BigDecimal;

public record CaretakerServiceResponse(
        long id, String name, String description, BigDecimal hourlyRate) {}
