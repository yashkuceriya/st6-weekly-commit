-- V4 — Weekly commit: the unit of weekly intent.
--
-- supporting_outcome_id is nullable in DRAFT (lets users save in-progress) but
-- the lock guard refuses the LOCKED transition unless every active commit has:
--   - supporting_outcome_id
--   - chess_layer_category_id
--   - priority_rank
--   - expected_evidence
-- See PlanLifecycleService for the validator.
--
-- Lock-time snapshot: locked_outcome_path + locked_outcome_titles capture the
-- breadcrumb as it was at lock time. Protects historical reporting if the
-- RCDO hierarchy is later renamed/restructured.
--
-- Carry-forward provenance: source_commit_id + carry_generation. A commit
-- carried forward from a Missed/Partial original points back via FK and
-- increments the generation; the UI uses this to escalate rationale
-- requirements at gens 2 and 3.

CREATE TABLE weekly_commit (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id                     UUID            NOT NULL REFERENCES weekly_plan(id) ON DELETE CASCADE,
    title                       VARCHAR(240)    NOT NULL,
    rationale                   TEXT,
    expected_evidence           TEXT,
    supporting_outcome_id       UUID            REFERENCES strategic_node(id),
    chess_layer_category_id     UUID            REFERENCES chess_layer_category(id),
    priority_rank               INTEGER         NOT NULL DEFAULT 1 CHECK (priority_rank >= 1),

    -- Lock-time snapshot, populated by Spring State Machine action on LOCK.
    locked_outcome_path         TEXT,
    locked_outcome_titles       JSONB,

    -- Carry-forward provenance.
    source_commit_id            UUID            REFERENCES weekly_commit(id),
    carry_generation            INTEGER         NOT NULL DEFAULT 1 CHECK (carry_generation >= 1),
    requires_manager_ack        BOOLEAN         NOT NULL DEFAULT FALSE,

    active                      BOOLEAN         NOT NULL DEFAULT TRUE,
    deleted_at                  TIMESTAMPTZ,
    version                     BIGINT          NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by                  VARCHAR(120)    NOT NULL DEFAULT 'system',
    updated_by                  VARCHAR(120)    NOT NULL DEFAULT 'system',

    CONSTRAINT chk_weekly_commit_lock_snapshot_pair
        CHECK ((locked_outcome_path IS NULL) = (locked_outcome_titles IS NULL))
);

CREATE INDEX idx_weekly_commit_plan ON weekly_commit(plan_id);
CREATE INDEX idx_weekly_commit_outcome ON weekly_commit(supporting_outcome_id);
CREATE INDEX idx_weekly_commit_chess ON weekly_commit(chess_layer_category_id);
CREATE INDEX idx_weekly_commit_source ON weekly_commit(source_commit_id) WHERE source_commit_id IS NOT NULL;
CREATE INDEX idx_weekly_commit_priority ON weekly_commit(plan_id, priority_rank) WHERE active = TRUE;

-- Only one ACTIVE carry-forward child per source commit. Prevents accidental
-- duplicate carries from racing reconciliations. PG warns that partial-index
-- predicates must be statically recognisable; this one (`active = TRUE`) is.
CREATE UNIQUE INDEX idx_weekly_commit_active_carry_child
    ON weekly_commit(source_commit_id) WHERE source_commit_id IS NOT NULL AND active = TRUE;

-- Outcome must be of type SUPPORTING_OUTCOME (lowest level). Cannot enforce
-- via FK alone since the column references strategic_node generally; we
-- enforce in PlanLifecycleService AND with a trigger here for defence in depth.
CREATE OR REPLACE FUNCTION weekly_commit_outcome_must_be_supporting() RETURNS TRIGGER AS $$
DECLARE
    node_type strategic_node_type;
BEGIN
    IF NEW.supporting_outcome_id IS NULL THEN
        RETURN NEW;
    END IF;
    SELECT type INTO node_type FROM strategic_node WHERE id = NEW.supporting_outcome_id;
    IF node_type IS NULL THEN
        RAISE EXCEPTION 'Strategic node % does not exist', NEW.supporting_outcome_id;
    END IF;
    IF node_type <> 'SUPPORTING_OUTCOME' THEN
        RAISE EXCEPTION 'Commit outcome must be a SUPPORTING_OUTCOME, got %', node_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_weekly_commit_outcome_type
    BEFORE INSERT OR UPDATE OF supporting_outcome_id ON weekly_commit
    FOR EACH ROW EXECUTE FUNCTION weekly_commit_outcome_must_be_supporting();
