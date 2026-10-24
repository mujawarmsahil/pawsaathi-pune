package in.pawsaathi.pune.security;

import com.fasterxml.jackson.databind.ObjectMapper;

import in.pawsaathi.pune.exception.ApiErrorResponse;
import in.pawsaathi.pune.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Component
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UserRepository users;
    private final ObjectMapper mapper;

    public JwtFilter(JwtService jwt, UserRepository users, ObjectMapper mapper) {
        this.jwt = jwt;
        this.users = users;
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                var user = users.findById(jwt.userId(header.substring(7))).orElse(null);
                boolean caretakerApproved =
                        user == null
                                || !"CARETAKER".equals(user.roleName())
                                || users.countApprovedCaretakers(user.getId()) > 0;
                if (user != null && user.isActive() && caretakerApproved) {
                    var principal =
                            new CurrentUser(
                                    user.getId(),
                                    user.getEmail(),
                                    user.roleName(),
                                    user.isMustChangePassword());
                    var authentication =
                            new UsernamePasswordAuthenticationToken(
                                    principal,
                                    null,
                                    java.util.List.of(
                                            new SimpleGrantedAuthority("ROLE_" + user.roleName())));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    String path = request.getRequestURI();
                    boolean passwordChangeRoute =
                            path.equals("/api/auth/me")
                                    || path.equals("/api/auth/password/change")
                                    || path.equals("/api/auth/logout")
                                    || path.equals("/api/auth/logout-all")
                                    || path.equals("/api/auth/refresh");
                    if (user.isMustChangePassword() && !passwordChangeRoute) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        mapper.writeValue(
                                response.getOutputStream(),
                                new ApiErrorResponse(
                                        Instant.now(),
                                        403,
                                        "PASSWORD_CHANGE_REQUIRED",
                                        "Change your password before continuing.",
                                        request.getRequestURI(),
                                        java.util.List.of()));
                        return;
                    }
                }
            } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
