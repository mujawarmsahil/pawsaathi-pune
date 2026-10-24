package in.pawsaathi.pune.validation;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class PasswordPolicyTest {
    private final PasswordPolicy policy = new PasswordPolicy();

    @Test
    void acceptsStrongPasswordAtMinimumLength() {
        assertTrue(policy.isStrong("ChangeMe123!"));
    }

    @Test
    void rejectsPasswordsMissingComplexityOrOutsideLengthBounds() {
        assertFalse(policy.isStrong("alllowercase123!"));
        assertFalse(policy.isStrong("Aa1!short"));
        assertFalse(policy.isStrong("A".repeat(73) + "a1!"));
        assertFalse(policy.isStrong(null));
    }
}
