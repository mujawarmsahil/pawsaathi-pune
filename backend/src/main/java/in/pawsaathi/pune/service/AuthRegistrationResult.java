package in.pawsaathi.pune.service;

public record AuthRegistrationResult(AuthSession session, String pendingApprovalMessage) {
    public static AuthRegistrationResult signedIn(AuthSession session) {
        return new AuthRegistrationResult(session, null);
    }

    public static AuthRegistrationResult pendingApproval(String message) {
        return new AuthRegistrationResult(null, message);
    }

    public boolean requiresApproval() {
        return session == null;
    }
}
