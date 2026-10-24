package in.pawsaathi.pune.migration;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
class FlywayMySqlMigrationTest {
    @Container
    static final MySQLContainer<?> MYSQL =
            new MySQLContainer<>("mysql:8.4")
                    .withDatabaseName("pawsaathi_test")
                    .withUsername("pawsaathi")
                    .withPassword("test-password");

    @Test
    void allVersionedMigrationsApplyOnMySql8() {
        var result =
                Flyway.configure()
                        .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                        .locations("classpath:db/migration")
                        .load()
                        .migrate();
        assertTrue(result.success);
        assertTrue(result.migrationsExecuted >= 6);
    }
}
