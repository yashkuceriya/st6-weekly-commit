-- V7 — Commit/plan audit trail. Every state transition, edit, integration
-- emission, and reminder writes a row here. Append-only; never updated.

CREATE TABLE commit_event (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID            REFERENCES weekly_plan(id) ON DELETE CASCADE,
    commit_id       UUID            REFERENCES weekly_commit(id) ON DELETE CASCADE,
    event_type      VARCHAR(64)     NOT NULL,
    actor           VARCHAR(120)    NOT NULL,
    payload         JSONB,
    occurred_at     TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT chk_commit_event_target
        CHECK (plan_id IS NOT NULL OR commit_id IS NOT NULL)
);

CREATE INDEX idx_commit_event_plan_time ON commit_event(plan_id, occurred_at DESC);
CREATE INDEX idx_commit_event_type_time ON commit_event(event_type, occurred_at DESC);
