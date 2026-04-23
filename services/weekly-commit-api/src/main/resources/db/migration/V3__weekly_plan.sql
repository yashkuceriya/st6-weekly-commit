-- V3 — Weekly plan: container for one user's commits in a specific week.
--
-- State machine = DRAFT → LOCKED → RECONCILING → RECONCILED.
-- Carry Forward is a transition action attached to RECONCILING/RECONCILED that
-- spawns child commits in the next week's DRAFT plan; not a 5th state.
-- See CLAUDE.md for the rationale and how to flip if Charles disagrees.

CREATE TYPE plan_state AS ENUM (
    'DRAFT',
    'LOCKED',
    'RECONCILING',
    'RECONCILED'
);

CREATE TABLE weekly_plan (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID            NOT NULL REFERENCES app_user(id),
    week_start_date             DATE            NOT NULL,
    state                       plan_state      NOT NULL DEFAULT 'DRAFT',
    drafted_at                  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    first_edit_at               TIMESTAMPTZ,
    locked_at                   TIMESTAMPTZ,
    reconciliation_started_at   TIMESTAMPTZ,
    reconciled_at               TIMESTAMPTZ,
    deleted_at                  TIMESTAMPTZ,
    version                     BIGINT          NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by                  VARCHAR(120)    NOT NULL DEFAULT 'system',
    updated_by                  VARCHAR(120)    NOT NULL DEFAULT 'system',

    CONSTRAINT chk_weekly_plan_week_is_monday
        CHECK (extract(isodow from week_start_date) = 1),
    CONSTRAINT chk_weekly_plan_state_timestamps
        CHECK (
            (state = 'DRAFT' AND locked_at IS NULL)
         OR (state = 'LOCKED' AND locked_at IS NOT NULL AND reconciliation_started_at IS NULL)
         OR (state = 'RECONCILING' AND reconciliation_started_at IS NOT NULL AND reconciled_at IS NULL)
         OR (state = 'RECONCILED' AND reconciled_at IS NOT NULL)
        )
);

-- Partial unique index: one ACTIVE plan per user per week (soft-deleted rows
-- excluded so a deleted plan can be restored / a user can re-create the week).
CREATE UNIQUE INDEX idx_weekly_plan_user_week_active
    ON weekly_plan(user_id, week_start_date) WHERE deleted_at IS NULL;

CREATE INDEX idx_weekly_plan_state ON weekly_plan(state);
CREATE INDEX idx_weekly_plan_week ON weekly_plan(week_start_date);
CREATE INDEX idx_weekly_plan_user_state ON weekly_plan(user_id, state);
