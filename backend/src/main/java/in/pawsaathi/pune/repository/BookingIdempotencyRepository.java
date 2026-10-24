package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.ConflictException;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.regex.Pattern;

@Repository
public class BookingIdempotencyRepository {
    private static final Pattern VALID_KEY = Pattern.compile("[A-Za-z0-9._:-]{1,128}");

    private final JdbcTemplate jdbc;

    public BookingIdempotencyRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Long> claimOrReplay(long customerId, String key, String requestHash) {
        if (!VALID_KEY.matcher(key).matches()) {
            throw new BadRequestException(
                    "Idempotency-Key must contain 1 to 128 letters, numbers, or . _ : -"
                            + " characters.");
        }

        jdbc.update(
                "INSERT IGNORE INTO booking_idempotency"
                        + " (customer_id, idempotency_key, request_hash) VALUES (?, ?, ?)",
                customerId,
                key,
                requestHash);

        var record =
                jdbc.queryForMap(
                        "SELECT request_hash, booking_id FROM booking_idempotency"
                                + " WHERE customer_id = ? AND idempotency_key = ? FOR UPDATE",
                        customerId,
                        key);
        if (!requestHash.equals(record.get("request_hash"))) {
            throw new ConflictException(
                    "This Idempotency-Key was already used for a different booking request.");
        }
        Object bookingId = record.get("booking_id");
        if (bookingId == null) {
            return Optional.empty();
        }
        return Optional.of(((Number) bookingId).longValue());
    }

    public void associateBooking(long customerId, String key, long bookingId) {
        int changed =
                jdbc.update(
                        "UPDATE booking_idempotency SET booking_id = ?"
                                + " WHERE customer_id = ? AND idempotency_key = ?"
                                + " AND booking_id IS NULL",
                        bookingId,
                        customerId,
                        key);
        if (changed != 1) {
            throw new IllegalStateException("Booking idempotency record was not claimable.");
        }
    }
}
