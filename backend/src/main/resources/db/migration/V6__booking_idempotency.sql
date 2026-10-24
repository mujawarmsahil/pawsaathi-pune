CREATE TABLE booking_idempotency (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_hash CHAR(64) NOT NULL,
    booking_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_idempotency_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_booking_idempotency_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT uq_booking_idempotency_customer_key UNIQUE (customer_id, idempotency_key),
    CONSTRAINT uq_booking_idempotency_booking UNIQUE (booking_id)
);
