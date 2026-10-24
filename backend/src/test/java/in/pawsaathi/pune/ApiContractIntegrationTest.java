package in.pawsaathi.pune;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
@AutoConfigureMockMvc
class ApiContractIntegrationTest {
    private static final String TEST_PASSWORD = "Phase0Strong!Pass";

    @Container
    static final MySQLContainer<?> MYSQL =
            new MySQLContainer<>("mysql:8.4")
                    .withDatabaseName("pawsaathi")
                    .withUsername("pawsaathi")
                    .withPassword("test-db-password");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("app.jwt.secret", () -> "phase0-integration-test-secret-at-least-32-bytes");
    }

    @Autowired private MockMvc mvc;

    @Autowired private ObjectMapper mapper;

    @Autowired private JdbcTemplate jdbc;

    @Autowired private PasswordEncoder passwords;

    @Test
    void registrationLoginMeAndRefreshRotation() throws Exception {
        String email = uniqueEmail("session");
        MvcResult registration =
                mvc.perform(
                                post("/api/auth/register")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(registerBody(email, "CUSTOMER")))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.user.email").value(email))
                        .andReturn();
        String registrationToken = token(registration);

        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + registrationToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));

        MvcResult login =
                mvc.perform(
                                post("/api/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                mapper.writeValueAsString(
                                                        java.util.Map.of(
                                                                "email",
                                                                email,
                                                                "password",
                                                                TEST_PASSWORD))))
                        .andExpect(status().isOk())
                        .andReturn();
        String oldRefreshCookie = cookieValue(login);

        MvcResult refresh =
                mvc.perform(
                                post("/api/auth/refresh")
                                        .cookie(new Cookie("pawsaathi_refresh", oldRefreshCookie)))
                        .andExpect(status().isOk())
                        .andReturn();
        String newRefreshCookie = cookieValue(refresh);
        org.junit.jupiter.api.Assertions.assertNotEquals(oldRefreshCookie, newRefreshCookie);

        mvc.perform(
                        post("/api/auth/refresh")
                                .cookie(new Cookie("pawsaathi_refresh", oldRefreshCookie)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bookingsRequireAuthenticationAndAreScopedForEachSupportedRole() throws Exception {
        mvc.perform(get("/api/bookings")).andExpect(status().isUnauthorized());

        String customerToken = token(register(uniqueEmail("customer"), "CUSTOMER"));
        String caretakerEmail = uniqueEmail("caretaker");
        register(caretakerEmail, "CARETAKER");
        approveCaretaker(caretakerEmail);
        String caretakerToken = token(login(emailId(caretakerEmail)));
        String adminToken = token(login(createAdminAccount(uniqueEmail("admin"))));

        for (String roleToken : new String[] {customerToken, caretakerToken, adminToken}) {
            mvc.perform(get("/api/bookings").header("Authorization", "Bearer " + roleToken))
                    .andExpect(status().isOk());
        }
        mvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void publicRegistrationRejectsPrivilegedAndUnknownRolesWithoutPersistingAnAdmin()
            throws Exception {
        for (String role : new String[] {"ADMIN", "admin", "AdMiN", "ROLE_ADMIN", "OWNER", ""}) {
            String email = uniqueEmail("rejected-role");
            mvc.perform(
                            post("/api/auth/register")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(registerBody(email, role)))
                    .andExpect(status().isBadRequest())
                    .andExpect(
                            jsonPath("$.errorCode")
                                    .value(
                                            role.isBlank()
                                                    ? "VALIDATION_ERROR"
                                                    : "REQUEST_REJECTED"));
            org.junit.jupiter.api.Assertions.assertFalse(
                    Boolean.TRUE.equals(
                            jdbc.queryForObject(
                                    "SELECT EXISTS(SELECT 1 FROM users WHERE email=?)",
                                    Boolean.class,
                                    email)));
        }

        String alternatePayloadEmail = uniqueEmail("alternate-role");
        mvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        mapper.writeValueAsString(
                                                java.util.Map.of(
                                                        "name", "Phase Zero Test",
                                                        "email", alternatePayloadEmail,
                                                        "password", TEST_PASSWORD,
                                                        "requestedRole", "ADMIN",
                                                        "roleId", 3,
                                                        "isAdmin", true))))
                .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertFalse(
                Boolean.TRUE.equals(
                        jdbc.queryForObject(
                                "SELECT EXISTS(SELECT 1 FROM users WHERE email=?)",
                                Boolean.class,
                                alternatePayloadEmail)));
    }

    @Test
    void publicRegistrationAllowsCustomerAndCaretakerRoles() throws Exception {
        for (String role : new String[] {"CUSTOMER", "CARETAKER"}) {
            String email = uniqueEmail("allowed-" + role.toLowerCase(java.util.Locale.ROOT));
            MvcResult result = register(email, role);
            JsonNode body = mapper.readTree(result.getResponse().getContentAsString());
            if ("CUSTOMER".equals(role)) {
                org.junit.jupiter.api.Assertions.assertEquals(
                        role, body.path("user").path("role").asText());
            } else {
                org.junit.jupiter.api.Assertions.assertEquals(
                        "PENDING_APPROVAL", body.path("status").asText());
                org.junit.jupiter.api.Assertions.assertEquals(
                        "PENDING",
                        jdbc.queryForObject(
                                "SELECT cp.approval_status FROM caretaker_profiles cp"
                                        + " JOIN users u ON u.id=cp.user_id WHERE u.email=?",
                                String.class,
                                email));
            }
            org.junit.jupiter.api.Assertions.assertEquals(
                    role,
                    jdbc.queryForObject(
                            "SELECT r.name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.email=?",
                            String.class,
                            email));
        }
    }

    @Test
    void caretakerSignInRequiresAdminApproval() throws Exception {
        String email = uniqueEmail("pending-caretaker");
        mvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(registerBody(email, "CARETAKER")))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"));

        mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        mapper.writeValueAsString(
                                                java.util.Map.of(
                                                        "email", email,
                                                        "password", TEST_PASSWORD))))
                .andExpect(status().isForbidden())
                .andExpect(
                        jsonPath("$.message")
                                .value(org.hamcrest.Matchers.containsString("awaiting approval")));

        approveCaretaker(email);
        mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        mapper.writeValueAsString(
                                                java.util.Map.of(
                                                        "email", email,
                                                        "password", TEST_PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("CARETAKER"));
    }

    @Test
    void bookingCreationReplaysSameKeyAndRejectsChangedPayload() throws Exception {
        BookingFixture fixture = bookingFixture("booking-replay");
        String body = bookingBody(fixture, "same request");

        createBooking(fixture.customerToken(), "invalid key", body, 400);
        MvcResult first = createBooking(fixture.customerToken(), "retry-1", body, 200);
        MvcResult replay = createBooking(fixture.customerToken(), "retry-1", body, 200);
        org.junit.jupiter.api.Assertions.assertEquals(
                mapper.readTree(first.getResponse().getContentAsString()).path("id").asLong(),
                mapper.readTree(replay.getResponse().getContentAsString()).path("id").asLong());

        createBooking(fixture.customerToken(), "retry-1", bookingBody(fixture, "changed"), 409);
    }

    @Test
    void concurrentOverlappingBookingRequestsAllowOnlyOneBooking() throws Exception {
        BookingFixture fixture = bookingFixture("booking-overlap");
        String body = bookingBody(fixture, "concurrent");

        CompletableFuture<Integer> first =
                CompletableFuture.supplyAsync(
                        () -> createBookingStatus(fixture.customerToken(), "parallel-1", body));
        CompletableFuture<Integer> second =
                CompletableFuture.supplyAsync(
                        () -> createBookingStatus(fixture.customerToken(), "parallel-2", body));
        int firstStatus = first.join();
        int secondStatus = second.join();

        org.junit.jupiter.api.Assertions.assertEquals(
                1,
                java.util.stream.Stream.of(firstStatus, secondStatus)
                        .filter(status -> status == 200)
                        .count());
        org.junit.jupiter.api.Assertions.assertTrue(
                (firstStatus == 409 && secondStatus == 200)
                        || (firstStatus == 200 && secondStatus == 409));
    }

    private BookingFixture bookingFixture(String label) throws Exception {
        String customerEmail = uniqueEmail(label + "-customer");
        String caretakerEmail = uniqueEmail(label + "-caretaker");
        String customerToken = token(register(customerEmail, "CUSTOMER"));
        register(caretakerEmail, "CARETAKER");
        long caretakerId = emailId(caretakerEmail);
        approveCaretaker(caretakerEmail);
        long serviceId =
                jdbc.queryForObject("SELECT id FROM services WHERE name='Pet walking'", Long.class);
        long areaId =
                jdbc.queryForObject("SELECT id FROM service_areas WHERE name='Baner'", Long.class);
        jdbc.update(
                "INSERT INTO caretaker_services(caretaker_id,service_id,hourly_rate) VALUES(?,?,399.00)",
                caretakerId,
                serviceId);
        jdbc.update(
                "INSERT INTO caretaker_service_areas(caretaker_id,area_id) VALUES(?,?)",
                caretakerId,
                areaId);

        LocalDate date = LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(3);
        jdbc.update(
                "INSERT INTO caretaker_availability(caretaker_id,weekday,starts_at,ends_at,is_available)"
                        + " VALUES(?,?, '00:00:00','23:59:00',TRUE)",
                caretakerId,
                date.getDayOfWeek().getValue() - 1);
        MvcResult pet =
                mvc.perform(
                                post("/api/pets")
                                        .header("Authorization", "Bearer " + customerToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                mapper.writeValueAsString(
                                                        java.util.Map.of(
                                                                "name", "Milo",
                                                                "species", "Dog"))))
                        .andExpect(status().isOk())
                        .andReturn();
        long petId = mapper.readTree(pet.getResponse().getContentAsString()).path("id").asLong();
        return new BookingFixture(
                customerToken,
                caretakerId,
                petId,
                serviceId,
                LocalDateTime.of(date, LocalTime.of(15, 0)),
                LocalDateTime.of(date, LocalTime.of(16, 0)));
    }

    private String bookingBody(BookingFixture fixture, String notes) throws Exception {
        return mapper.writeValueAsString(
                java.util.Map.of(
                        "caretakerId", fixture.caretakerId(),
                        "petId", fixture.petId(),
                        "serviceId", fixture.serviceId(),
                        "startsAt", fixture.startsAt(),
                        "endsAt", fixture.endsAt(),
                        "location", "Baner",
                        "notes", notes));
    }

    private MvcResult createBooking(
            String token, String idempotencyKey, String body, int expectedStatus) throws Exception {
        return mvc.perform(
                        post("/api/bookings")
                                .header("Authorization", "Bearer " + token)
                                .header("Idempotency-Key", idempotencyKey)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().is(expectedStatus))
                .andReturn();
    }

    private int createBookingStatus(String token, String idempotencyKey, String body) {
        try {
            return mvc.perform(
                            post("/api/bookings")
                                    .header("Authorization", "Bearer " + token)
                                    .header("Idempotency-Key", idempotencyKey)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(body))
                    .andReturn()
                    .getResponse()
                    .getStatus();
        } catch (Exception exception) {
            throw new RuntimeException(exception);
        }
    }

    private record BookingFixture(
            String customerToken,
            long caretakerId,
            long petId,
            long serviceId,
            LocalDateTime startsAt,
            LocalDateTime endsAt) {}

    private MvcResult register(String email, String role) throws Exception {
        int expectedStatus = "CARETAKER".equals(role) ? 202 : 200;
        return mvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(registerBody(email, role)))
                .andExpect(status().is(expectedStatus))
                .andReturn();
    }

    private long emailId(String email) {
        return jdbc.queryForObject("SELECT id FROM users WHERE email=?", Long.class, email);
    }

    private void approveCaretaker(String email) {
        long userId = emailId(email);
        jdbc.update(
                "UPDATE users SET status='ACTIVE' WHERE id=?", userId);
        jdbc.update(
                "UPDATE caretaker_profiles"
                        + " SET approval_status='APPROVED', is_verified=TRUE WHERE user_id=?",
                userId);
    }

    private long createAdminAccount(String email) {
        Long roleId =
                jdbc.queryForObject("SELECT id FROM roles WHERE name='ADMIN'", Long.class);
        jdbc.update(
                "INSERT INTO users(name,email,password_hash,role_id,is_verified,status,must_change_password,version)"
                        + " VALUES(?,?,?,?,TRUE,'ACTIVE',FALSE,0)",
                "Test Admin",
                email,
                passwords.encode(TEST_PASSWORD),
                roleId);
        return jdbc.queryForObject("SELECT id FROM users WHERE email=?", Long.class, email);
    }

    private MvcResult login(long userId) throws Exception {
        String email = jdbc.queryForObject("SELECT email FROM users WHERE id=?", String.class, userId);
        return mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        mapper.writeValueAsString(
                                                java.util.Map.of(
                                                        "email", email,
                                                        "password", TEST_PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
    }

    private String registerBody(String email, String role) throws Exception {
        return mapper.writeValueAsString(
                java.util.Map.of(
                        "name", "Phase Zero Test",
                        "email", email,
                        "password", TEST_PASSWORD,
                        "role", role));
    }

    private String token(MvcResult result) throws Exception {
        JsonNode body =
                mapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        return body.path("token").asText();
    }

    private String cookieValue(MvcResult result) {
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        org.junit.jupiter.api.Assertions.assertNotNull(setCookie);
        return setCookie.substring("pawsaathi_refresh=".length(), setCookie.indexOf(';'));
    }

    private static String uniqueEmail(String label) {
        String safeLabel = label.substring(0, Math.min(label.length(), 20));
        return "phase0-" + safeLabel + "-" + UUID.randomUUID() + "@example.com";
    }
}
