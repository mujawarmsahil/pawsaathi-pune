ALTER TABLE bookings
    ADD COLUMN cancellation_reason VARCHAR(500) NULL AFTER status;
