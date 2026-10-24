package in.pawsaathi.pune.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class ProductionConfigurationValidator implements ApplicationRunner {
    private final Environment environment;
    private final AppProperties properties;

    public ProductionConfigurationValidator(Environment environment, AppProperties properties) {
        this.environment = environment;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!Arrays.asList(environment.getActiveProfiles()).contains("prod")) return;
        String jwtSecret = environment.getProperty("JWT_SECRET", "");
        String dbPassword = environment.getProperty("DB_PASSWORD", "");
        String origins = properties.cors().allowedOrigins();
        if (jwtSecret.length() < 32
                || jwtSecret.equals("development-secret-change-me-before-production-1234567890")
                || jwtSecret.toLowerCase(java.util.Locale.ROOT).contains("replace-with")
                || jwtSecret.toLowerCase(java.util.Locale.ROOT).contains("change-me")) {
            throw new IllegalStateException(
                    "Production requires a private JWT_SECRET of at least 32 characters.");
        }
        if (dbPassword.isBlank()
                || dbPassword.toLowerCase(java.util.Locale.ROOT).contains("replace-with")) {
            throw new IllegalStateException("Production requires a non-placeholder DB_PASSWORD.");
        }
        if (origins == null
                || origins.isBlank()
                || origins.contains("localhost")
                || origins.contains("127.0.0.1")) {
            throw new IllegalStateException(
                    "Production requires CORS_ALLOWED_ORIGINS with deployed HTTPS origins only.");
        }
        if (!properties.security().secureCookies()) {
            throw new IllegalStateException(
                    "Production requires secure HTTP-only refresh cookies.");
        }
    }
}
