-- V6 — Manager review of a reconciled plan.

CREATE TYPE review_status AS ENUM ('PENDING', 'APPROVED', 'NEEDS_DISCUSSION');

CREATE TABLE manager_review (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id             UUID            NOT NULL UNIQUE REFERENCES weekly_plan(id) ON DELETE CASCADE,
    reviewer_id         UUID            NOT NULL REFERENCES app_user(id),
    reviewed_at         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    status              review_status   NOT NULL DEFAULT 'PENDING',
    summary_note        TEXT,
    version             BIGINT          NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by          VARCHAR(120)    NOT NULL DEFAULT 'system',
    updated_by          VARCHAR(120)    NOT NULL DEFAULT 'system'
);

CREATE INDEX idx_manager_review_reviewer ON manager_review(reviewer_id);
CREATE INDEX idx_manager_review_status ON manager_review(status);
