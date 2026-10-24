package in.pawsaathi.pune.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.validation.PublicRegistrationRolePolicy;

import org.junit.jupiter.api.Test;

class PublicRegistrationRoleTest {
    private final PublicRegistrationRolePolicy policy = new PublicRegistrationRolePolicy();

    @Test
    void allowsOnlyPublicRolesAndNormalizesCaseAndWhitespace() {
        assertEquals("CUSTOMER", policy.normalize("customer"));
        assertEquals("CARETAKER", policy.normalize(" CareTaker "));
    }

    @Test
    void rejectsPrivilegedInvalidAndMissingRolesAsBadRequest() {
        for (String role : new String[] {"ADMIN", "admin", "AdMiN", "ROLE_ADMIN", "OWNER", ""}) {
            assertThrows(BadRequestException.class, () -> policy.normalize(role));
        }
        assertThrows(BadRequestException.class, () -> policy.normalize(null));
    }
}
