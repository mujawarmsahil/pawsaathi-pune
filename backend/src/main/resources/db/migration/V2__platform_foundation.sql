ALTER TABLE users ADD COLUMN status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE pets ADD COLUMN photo_url VARCHAR(500) NULL;
ALTER TABLE pets ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE pets ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE caretaker_profiles ADD COLUMN photo_url VARCHAR(500) NULL;
ALTER TABLE caretaker_profiles ADD COLUMN languages VARCHAR(250) NULL;
ALTER TABLE caretaker_profiles ADD COLUMN service_types VARCHAR(500) NULL;
ALTER TABLE caretaker_profiles ADD COLUMN approval_status VARCHAR(24) NOT NULL DEFAULT 'PENDING';
ALTER TABLE caretaker_profiles ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE bookings ADD COLUMN location VARCHAR(250) NULL;
ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE payments ADD COLUMN provider_order_id VARCHAR(160) NULL;
ALTER TABLE payments ADD COLUMN provider_payment_id VARCHAR(160) NULL;
ALTER TABLE bookings ADD INDEX idx_bookings_caretaker_time (caretaker_id, starts_at, ends_at, status);
ALTER TABLE bookings ADD INDEX idx_bookings_customer_created (customer_id, created_at);
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN moderation_status VARCHAR(24) NOT NULL DEFAULT 'PENDING';

CREATE TABLE refresh_tokens (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMP NOT NULL, revoked_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id), INDEX idx_refresh_user (user_id, expires_at)
);
CREATE TABLE email_verifications (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMP NOT NULL, verified_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE phone_verifications (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, code_hash CHAR(64) NOT NULL,
 expires_at TIMESTAMP NOT NULL, verified_at TIMESTAMP NULL, attempts INT NOT NULL DEFAULT 0,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_phone_verification_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE caretaker_documents (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, caretaker_id BIGINT NOT NULL, document_type VARCHAR(40) NOT NULL,
 storage_key VARCHAR(500) NOT NULL, review_status VARCHAR(24) NOT NULL DEFAULT 'PENDING', reviewed_by BIGINT NULL,
 reviewed_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_doc_caretaker FOREIGN KEY (caretaker_id) REFERENCES users(id), CONSTRAINT fk_doc_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
CREATE TABLE caretaker_services (
 caretaker_id BIGINT NOT NULL, service_id BIGINT NOT NULL, hourly_rate DECIMAL(10,2) NOT NULL,
 PRIMARY KEY (caretaker_id, service_id), CONSTRAINT fk_cs_caretaker FOREIGN KEY (caretaker_id) REFERENCES users(id),
 CONSTRAINT fk_cs_service FOREIGN KEY (service_id) REFERENCES services(id)
);
CREATE TABLE caretaker_availability (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, caretaker_id BIGINT NOT NULL, weekday INT NULL,
 starts_at TIME NOT NULL, ends_at TIME NOT NULL, unavailable_date DATE NULL, is_available BOOLEAN NOT NULL DEFAULT TRUE,
 CONSTRAINT fk_avail_caretaker FOREIGN KEY (caretaker_id) REFERENCES users(id),
 INDEX idx_availability_date (caretaker_id, unavailable_date, weekday)
);
CREATE TABLE service_areas (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, city VARCHAR(80) NOT NULL DEFAULT 'Pune', is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE booking_status_history (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, booking_id BIGINT NOT NULL, from_status VARCHAR(30), to_status VARCHAR(30) NOT NULL,
 changed_by BIGINT NULL, note VARCHAR(500), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_history_booking FOREIGN KEY (booking_id) REFERENCES bookings(id), CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES users(id),
 INDEX idx_history_booking (booking_id, created_at)
);
CREATE TABLE refunds (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, payment_id BIGINT NOT NULL, amount DECIMAL(10,2) NOT NULL,
 status VARCHAR(30) NOT NULL DEFAULT 'PENDING', provider_reference VARCHAR(160), reason VARCHAR(500),
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);
CREATE TABLE notifications (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, title VARCHAR(160) NOT NULL, body VARCHAR(1000) NOT NULL,
 type VARCHAR(50) NOT NULL, read_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id), INDEX idx_notification_inbox (user_id, read_at, created_at)
);
CREATE TABLE support_tickets (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, booking_id BIGINT NULL, subject VARCHAR(180) NOT NULL,
 description TEXT NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'OPEN', priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
 assigned_to BIGINT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id), CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
 CONSTRAINT fk_ticket_assignee FOREIGN KEY (assigned_to) REFERENCES users(id), INDEX idx_ticket_status (status, priority, created_at)
);
CREATE TABLE audit_logs (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, actor_id BIGINT NULL, action VARCHAR(120) NOT NULL, resource_type VARCHAR(80) NOT NULL,
 resource_id BIGINT NULL, metadata JSON NULL, ip_address VARCHAR(45), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id), INDEX idx_audit_created (created_at), INDEX idx_audit_resource (resource_type, resource_id)
);
INSERT IGNORE INTO service_areas (name) VALUES ('Baner'), ('Aundh'), ('Kothrud'), ('Viman Nagar'), ('Koregaon Park'), ('Kharadi'), ('Wakad'), ('Hadapsar');
