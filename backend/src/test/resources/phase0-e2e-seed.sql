DELETE FROM booking_status_history
WHERE booking_id IN (
    SELECT id FROM bookings
    WHERE customer_id IN (
        SELECT id FROM users
        WHERE email LIKE 'phase0-e2e-customer-%'
           OR email LIKE 'phase0-customer-%'
           OR email LIKE 'phase0-debug-%'
    )
);
DELETE FROM payments
WHERE booking_id IN (
    SELECT id FROM bookings
    WHERE customer_id IN (
        SELECT id FROM users
        WHERE email LIKE 'phase0-e2e-customer-%'
           OR email LIKE 'phase0-customer-%'
           OR email LIKE 'phase0-debug-%'
    )
);
DELETE FROM audit_logs
WHERE actor_id IN (
    SELECT id FROM users
    WHERE email LIKE 'phase0-e2e-customer-%'
       OR email LIKE 'phase0-customer-%'
       OR email LIKE 'phase0-debug-%'
)
OR (resource_type = 'BOOKING' AND resource_id IN (
    SELECT id FROM bookings
    WHERE customer_id IN (
        SELECT id FROM users
        WHERE email LIKE 'phase0-e2e-customer-%'
           OR email LIKE 'phase0-customer-%'
           OR email LIKE 'phase0-debug-%'
    )
));
DELETE FROM support_tickets
WHERE user_id IN (
    SELECT id FROM users
    WHERE email LIKE 'phase0-e2e-customer-%'
       OR email LIKE 'phase0-customer-%'
       OR email LIKE 'phase0-debug-%'
);
DELETE FROM notifications
WHERE user_id IN (
    SELECT id FROM users
    WHERE email LIKE 'phase0-e2e-customer-%'
       OR email LIKE 'phase0-customer-%'
       OR email LIKE 'phase0-debug-%'
);
DELETE FROM bookings
WHERE customer_id IN (
    SELECT id FROM users
    WHERE email LIKE 'phase0-e2e-customer-%'
       OR email LIKE 'phase0-customer-%'
       OR email LIKE 'phase0-debug-%'
);
DELETE FROM pets
WHERE owner_id IN (
    SELECT id FROM users
    WHERE email LIKE 'phase0-e2e-customer-%'
       OR email LIKE 'phase0-customer-%'
       OR email LIKE 'phase0-debug-%'
);
DELETE FROM refresh_tokens
WHERE user_id IN (
    SELECT id FROM users
    WHERE email LIKE 'phase0-e2e-customer-%'
       OR email LIKE 'phase0-customer-%'
       OR email LIKE 'phase0-debug-%'
);
DELETE FROM users
WHERE email LIKE 'phase0-e2e-customer-%'
   OR email LIKE 'phase0-customer-%'
   OR email LIKE 'phase0-debug-%';

INSERT INTO users (name, email, password_hash, role_id, status, deleted_at, is_verified, must_change_password)
SELECT 'Phase Zero Test Caretaker', 'phase0-caretaker@example.test', admin_user.password_hash,
       caretaker_role.id, 'ACTIVE', NULL, TRUE, FALSE
FROM roles caretaker_role
JOIN roles admin_role ON admin_role.name = 'ADMIN'
JOIN users admin_user ON admin_user.role_id = admin_role.id
WHERE caretaker_role.name = 'CARETAKER'
ORDER BY admin_user.id
LIMIT 1
ON DUPLICATE KEY UPDATE status = 'ACTIVE', deleted_at = NULL, is_verified = TRUE;

SET @phase0_caretaker_id = (
    SELECT id FROM users WHERE email = 'phase0-caretaker@example.test' AND status = 'ACTIVE'
);

INSERT INTO caretaker_profiles
    (user_id, bio, experience_years, hourly_rate, service_areas, is_verified,
     photo_url, languages, service_types, approval_status)
VALUES
    (@phase0_caretaker_id, 'A friendly test caretaker for the local booking journey.',
     4.0, 399.00, '', TRUE, NULL, 'English, Hindi', '', 'APPROVED')
ON DUPLICATE KEY UPDATE
    bio = VALUES(bio), experience_years = VALUES(experience_years),
    hourly_rate = VALUES(hourly_rate), is_verified = TRUE, approval_status = 'APPROVED';

DELETE FROM caretaker_services WHERE caretaker_id = @phase0_caretaker_id;
INSERT INTO caretaker_services (caretaker_id, service_id, hourly_rate)
SELECT @phase0_caretaker_id, id, 399.00 FROM services WHERE name = 'Pet walking' LIMIT 1;

DELETE FROM caretaker_service_areas WHERE caretaker_id = @phase0_caretaker_id;
INSERT INTO caretaker_service_areas (caretaker_id, area_id)
SELECT @phase0_caretaker_id, id FROM service_areas WHERE name = 'Baner' AND is_active = TRUE LIMIT 1;

DELETE FROM caretaker_availability WHERE caretaker_id = @phase0_caretaker_id;
INSERT INTO caretaker_availability
    (caretaker_id, weekday, starts_at, ends_at, unavailable_date, is_available)
SELECT @phase0_caretaker_id, weekdays.weekday, '00:00:00', '23:59:00', NULL, TRUE
FROM (
    SELECT 0 AS weekday UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
    SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) weekdays;
