-- Development-only review seed data.
-- Do not run against production. This is intentionally not a Flyway migration.
--
-- Requires the baseline local seed users and pets:
--   customers: ananya.deshmukh@example.com, rohan.kulkarni@example.com, sneha.patil@example.com
--   caretakers: priya.joshi@example.com, arjun.rao@example.com, meera.shah@example.com
--
-- Creates completed bookings and published reviews for the admin Reviews page.

SET @customer_ananya = (SELECT id FROM users WHERE email = 'ananya.deshmukh@example.com');
SET @customer_rohan = (SELECT id FROM users WHERE email = 'rohan.kulkarni@example.com');
SET @customer_sneha = (SELECT id FROM users WHERE email = 'sneha.patil@example.com');
SET @caretaker_priya = (SELECT id FROM users WHERE email = 'priya.joshi@example.com');
SET @caretaker_arjun = (SELECT id FROM users WHERE email = 'arjun.rao@example.com');
SET @caretaker_meera = (SELECT id FROM users WHERE email = 'meera.shah@example.com');
SET @pet_bruno = (SELECT id FROM pets WHERE owner_id = @customer_ananya AND name = 'Bruno');
SET @pet_simba = (SELECT id FROM pets WHERE owner_id = @customer_rohan AND name = 'Simba');
SET @pet_coco = (SELECT id FROM pets WHERE owner_id = @customer_sneha AND name = 'Coco');
SET @service_walking = (SELECT id FROM services WHERE name = 'Pet walking');
SET @service_companionship = (SELECT id FROM services WHERE name = 'Pet playing and companionship');
SET @service_short_care = (SELECT id FROM services WHERE name = 'Short-duration pet care');

DELETE FROM booking_status_history
WHERE booking_id IN (SELECT id FROM bookings WHERE notes LIKE 'DEV_SEED_REVIEWS:%');
DELETE FROM booking_idempotency
WHERE booking_id IN (SELECT id FROM bookings WHERE notes LIKE 'DEV_SEED_REVIEWS:%');
DELETE FROM payments
WHERE booking_id IN (SELECT id FROM bookings WHERE notes LIKE 'DEV_SEED_REVIEWS:%');
DELETE FROM support_tickets
WHERE booking_id IN (SELECT id FROM bookings WHERE notes LIKE 'DEV_SEED_REVIEWS:%');
DELETE FROM reviews
WHERE booking_id IN (SELECT id FROM bookings WHERE notes LIKE 'DEV_SEED_REVIEWS:%');
DELETE FROM bookings WHERE notes LIKE 'DEV_SEED_REVIEWS:%';

INSERT INTO bookings
    (customer_id, caretaker_id, pet_id, service_id, starts_at, ends_at, status, hourly_rate,
     location, notes)
VALUES
    (@customer_ananya, @caretaker_priya, @pet_bruno, @service_walking,
     '2026-10-20 08:00:00', '2026-10-20 09:00:00', 'COMPLETED', 450.00,
     'Baner, Pune', 'DEV_SEED_REVIEWS:ANANYA');
SET @booking_ananya = LAST_INSERT_ID();

INSERT INTO bookings
    (customer_id, caretaker_id, pet_id, service_id, starts_at, ends_at, status, hourly_rate,
     location, notes)
VALUES
    (@customer_rohan, @caretaker_arjun, @pet_simba, @service_companionship,
     '2026-10-16 10:00:00', '2026-10-16 12:00:00', 'COMPLETED', 500.00,
     'Aundh, Pune', 'DEV_SEED_REVIEWS:ROHAN');
SET @booking_rohan = LAST_INSERT_ID();

INSERT INTO bookings
    (customer_id, caretaker_id, pet_id, service_id, starts_at, ends_at, status, hourly_rate,
     location, notes)
VALUES
    (@customer_sneha, @caretaker_meera, @pet_coco, @service_short_care,
     '2026-10-13 15:00:00', '2026-10-13 16:00:00', 'COMPLETED', 550.00,
     'Kothrud, Pune', 'DEV_SEED_REVIEWS:SNEHA');
SET @booking_sneha = LAST_INSERT_ID();

INSERT INTO reviews
    (booking_id, author_id, caretaker_id, rating, comment, created_at)
VALUES
    (@booking_ananya, @customer_ananya, @caretaker_priya, 5,
     'Priya was patient and caring with Bruno. He came back relaxed and happy after every walk.',
     CURRENT_TIMESTAMP - INTERVAL 1 DAY),
    (@booking_rohan, @customer_rohan, @caretaker_arjun, 4,
     'Arjun kept Simba company and sent regular updates. Punctual, friendly, and reliable.',
     CURRENT_TIMESTAMP - INTERVAL 4 DAY),
    (@booking_sneha, @customer_sneha, @caretaker_meera, 2,
     'The visit started late and the caretaker asked me to continue off-platform to avoid fees.',
     CURRENT_TIMESTAMP - INTERVAL 7 DAY);
