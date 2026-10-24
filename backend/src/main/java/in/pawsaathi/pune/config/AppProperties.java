package in.pawsaathi.pune.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Cors cors, Jwt jwt, Security security) {
    public record Cors(String allowedOrigins) {}

    public record Jwt(String secret, long accessTokenMinutes, long refreshTokenDays) {}

    public record Security(boolean secureCookies) {}
}
