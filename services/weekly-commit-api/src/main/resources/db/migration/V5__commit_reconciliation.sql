-- V5 — Commit reconciliation: per-commit "what actually happened".

CREATE TYPE commit_status AS ENUM ('DELIVERED', 'PARTIAL', 'MISSED');

CREATE TYPE carry_decision AS ENUM (
    'DROP',                 -- abandon, no follow-up
    'FINISHED_NEXT_WEEK',   -- moved to next week as a fresh commit
    'CARRY_FORWARD'         -- explicit carry; system creates child commit
);

CREATE TABLE commit_reconciliation (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_id           UUID                NOT NULL UNIQUE REFERENCES weekly_commit(id) ON DELETE CASCADE,
    status              commit_status       NOT NULL,
    actual_outcome      TEXT,
    delta_reason        TEXT,
    carry_decision      carry_decision,
    carry_rationale     TEXT,
    next_commit_id      UUID                REFERENCES weekly_commit(id),
    reconciled_at       TIMESTAMPTZ         NOT NULL DEFAULT now(),
    version             BIGINT              NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT now(),
    created_by          VARCHAR(120)        NOT NULL DEFAULT 'system',
    updated_by          VARCHAR(120)        NOT NULL DEFAULT 'system',

    CONSTRAINT chk_reconciliation_carry_only_when_not_delivered
        CHECK (
            status = 'DELIVERED' OR carry_decision IS NOT NULL
        )
);

CREATE INDEX idx_reconciliation_status ON commit_reconciliation(status);
CREATE INDEX idx_reconciliation_carry ON commit_reconciliation(carry_decision)
    WHERE carry_decision IS NOT NULL;
