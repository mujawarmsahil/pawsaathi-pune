package in.pawsaathi.pune.repository;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest(
        properties = {
            "spring.flyway.enabled=false",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "spring.datasource.url=jdbc:h2:mem:pawsaathi;MODE=MySQL;DB_CLOSE_DELAY=-1"
        })
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class RepositoryQueryValidationTest {
    @Autowired BookingRepository bookings;
    @Autowired CaretakerAvailabilityRepository availability;

    @Test
    void repositoryQueriesInitializeAgainstJpaMappings() {
        assertNotNull(bookings);
        assertNotNull(availability);
    }
}
