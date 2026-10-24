ALTER TABLE refunds
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE admin_actions
    ADD INDEX idx_admin_actions_admin_created (admin_id, created_at),
    ADD INDEX idx_admin_actions_target (target_type, target_id);
