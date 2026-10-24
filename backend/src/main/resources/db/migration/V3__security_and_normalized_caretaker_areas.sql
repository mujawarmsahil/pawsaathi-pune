ALTER TABLE users
    ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0,
    ADD INDEX idx_users_status_deleted (status, deleted_at);

ALTER TABLE caretaker_profiles
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE pets
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0,
    ADD INDEX idx_pets_owner_deleted_created (owner_id, deleted_at, created_at);

ALTER TABLE bookings
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0,
    ADD INDEX idx_bookings_status_starts (status, starts_at),
    ADD INDEX idx_bookings_caretaker_status (caretaker_id, status, starts_at);

INSERT IGNORE INTO roles (name) VALUES ('CUSTOMER'), ('CARETAKER'), ('ADMIN');
INSERT INTO services (name, description, default_hourly_rate)
SELECT 'Pet walking', 'Gentle, reliable walks', 399.00
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Pet walking');
INSERT INTO services (name, description, default_hourly_rate)
SELECT 'Pet playing and companionship', 'Play and company at home', 449.00
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Pet playing and companionship');
INSERT INTO services (name, description, default_hourly_rate)
SELECT 'Short-duration pet care', 'Attentive hourly care', 499.00
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Short-duration pet care');

CREATE TABLE caretaker_service_areas (
    caretaker_id BIGINT NOT NULL,
    area_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (caretaker_id, area_id),
    CONSTRAINT fk_csa_caretaker FOREIGN KEY (caretaker_id) REFERENCES users(id),
    CONSTRAINT fk_csa_area FOREIGN KEY (area_id) REFERENCES service_areas(id),
    INDEX idx_csa_area_caretaker (area_id, caretaker_id)
);

INSERT IGNORE INTO service_areas (name, city)
SELECT DISTINCT TRIM(area_name), 'Pune'
FROM caretaker_profiles cp
JOIN JSON_TABLE(
    CONCAT('["', REPLACE(REPLACE(cp.service_areas, '"', '\\"'), ',', '","'), '"]'),
    '$[*]' COLUMNS (area_name VARCHAR(100) PATH '$')
) AS areas
WHERE cp.service_areas IS NOT NULL AND TRIM(area_name) <> '';

INSERT IGNORE INTO caretaker_service_areas (caretaker_id, area_id)
SELECT cp.user_id, sa.id
FROM caretaker_profiles cp
JOIN JSON_TABLE(
    CONCAT('["', REPLACE(REPLACE(cp.service_areas, '"', '\\"'), ',', '","'), '"]'),
    '$[*]' COLUMNS (area_name VARCHAR(100) PATH '$')
) AS areas
JOIN service_areas sa ON LOWER(sa.name) = LOWER(TRIM(areas.area_name))
WHERE cp.service_areas IS NOT NULL AND TRIM(areas.area_name) <> '';

INSERT IGNORE INTO caretaker_services (caretaker_id, service_id, hourly_rate)
SELECT cp.user_id, s.id, cp.hourly_rate
FROM caretaker_profiles cp
JOIN JSON_TABLE(
    CONCAT('["', REPLACE(REPLACE(cp.service_types, '"', '\\"'), ',', '","'), '"]'),
    '$[*]' COLUMNS (service_name VARCHAR(100) PATH '$')
) AS services
JOIN services s ON LOWER(s.name) = LOWER(TRIM(services.service_name))
WHERE cp.service_types IS NOT NULL AND TRIM(services.service_name) <> '';

UPDATE caretaker_profiles SET service_areas = '', service_types = '';
