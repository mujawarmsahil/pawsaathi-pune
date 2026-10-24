package in.pawsaathi.pune.validation;

import in.pawsaathi.pune.constant.Role;
import in.pawsaathi.pune.exception.BadRequestException;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class PublicRegistrationRolePolicy {
    public String normalize(String requestedRole) {
        if (requestedRole == null) {
            throw new BadRequestException("Role must be one of CUSTOMER or CARETAKER.");
        }
        return switch (requestedRole.trim().toUpperCase(Locale.ROOT)) {
            case "CUSTOMER" -> Role.CUSTOMER.name();
            case "CARETAKER" -> Role.CARETAKER.name();
            default ->
                    throw new BadRequestException(
                            "Role must be one of CUSTOMER or CARETAKER.");
        };
    }
}
