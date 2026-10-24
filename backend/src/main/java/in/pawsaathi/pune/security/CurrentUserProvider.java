package in.pawsaathi.pune.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {
    public CurrentUser require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof CurrentUser currentUser) {
            return currentUser;
        }
        throw new IllegalStateException("An authenticated user is required.");
    }
}
