CREATE TABLE payment_webhook_events (
    event_id VARCHAR(160) NOT NULL PRIMARY KEY,
    event_type VARCHAR(120) NOT NULL,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_webhook_received (received_at)
);

ALTER TABLE payments
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0,
    ADD INDEX idx_payments_provider_order (provider_order_id),
    ADD INDEX idx_payments_provider_payment (provider_payment_id);

ALTER TABLE reviews
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE support_tickets
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
