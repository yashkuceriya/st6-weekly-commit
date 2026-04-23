-- V11 — Promote role flags to a proper user_role join table.
--
-- The boolean is_manager / is_admin columns on app_user were a v0 shortcut.
-- A join table cleanly supports: future per-team role grants (e.g. "MANAGER
-- of Engineering only"), audit of when a role was granted/revoked, and
-- multi-role users (an admin who is also a manager).
--
-- Kept the boolean columns in place for one cycle so any code reading them
-- still works during the rollout. Will drop in V12+ once the codebase has
-- migrated.

CREATE TYPE app_role AS ENUM ('IC', 'MANAGER', 'ADMIN');

CREATE TABLE user_role (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role            app_role        NOT NULL,
    granted_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    granted_by      VARCHAR(120)    NOT NULL DEFAULT 'system',
    revoked_at      TIMESTAMPTZ,
    -- A user can hold the same role at most once at a time (active grant).
    CONSTRAINT chk_user_role_revocation
        CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

CREATE UNIQUE INDEX idx_user_role_active
    ON user_role(user_id, role) WHERE revoked_at IS NULL;

CREATE INDEX idx_user_role_lookup ON user_role(user_id) WHERE revoked_at IS NULL;

-- Backfill from the legacy boolean columns. Every user gets IC; managers and
-- admins get the corresponding additional rows.
INSERT INTO user_role (user_id, role)
    SELECT id, 'IC'::app_role FROM app_user WHERE active = TRUE;

INSERT INTO user_role (user_id, role)
    SELECT id, 'MANAGER'::app_role FROM app_user WHERE is_manager = TRUE AND active = TRUE;

INSERT INTO user_role (user_id, role)
    SELECT id, 'ADMIN'::app_role FROM app_user WHERE is_admin = TRUE AND active = TRUE;
