package in.pawsaathi.pune.security;

import in.pawsaathi.pune.config.AppProperties;
import in.pawsaathi.pune.entity.AppUser;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

@Service
public class JwtService {
    private final SecretKey key;
    private final long accessTokenMinutes;

    public JwtService(AppProperties properties) {
        String secret = properties.jwt().secret();
        byte[] secretBytes =
                secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least 32 bytes (256 bits). Load the project .env file"
                            + " before starting the API.");
        }
        key = Keys.hmacShaKeyFor(secretBytes);
        accessTokenMinutes = properties.jwt().accessTokenMinutes();
    }

    public String create(AppUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.roleName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTokenMinutes * 60)))
                .signWith(key)
                .compact();
    }

    public long userId(String token) {
        return Long.parseLong(
                Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload()
                        .getSubject());
    }
}
