-- V10 — Hot-path performance indexes for the brief's 2000-record team scale.
--
-- Kept in a separate migration on purpose: makes the perf-tuning intent
-- visible in the migration history and lets ops/DBA review independently of
-- schema changes. PG can `CREATE INDEX CONCURRENTLY` for production rollouts;
-- in the dev/test image we accept locking inserts for the duration.

-- Manager queue: unpaid lookups by team+week filter heavy on app_user.team_id
-- joined to weekly_plan.user_id with state filter. Composite index avoids the
-- planner falling back to a seq scan once the table grows past ~10k plans.
CREATE INDEX IF NOT EXISTS idx_weekly_plan_team_week_state
    ON weekly_plan(user_id, week_start_date, state) WHERE deleted_at IS NULL;

-- Exception queue: PENDING_REVIEW_SLA scans plans with state=RECONCILED but
-- no manager_review row. Partial index narrows to that segment.
CREATE INDEX IF NOT EXISTS idx_weekly_plan_reconciled_unreviewed
    ON weekly_plan(reconciled_at) WHERE state = 'RECONCILED';

-- Carry-forward chain walks (provenance lookups for repeated-carry exception
-- detection). Already covered by idx_weekly_commit_source but adds support
-- for the CTE's join direction (parent → child).
CREATE INDEX IF NOT EXISTS idx_weekly_commit_carry_chain
    ON weekly_commit(source_commit_id, carry_generation)
    WHERE source_commit_id IS NOT NULL;

-- Outcome coverage gap detection: scans active SUPPORTING_OUTCOME nodes
-- left-joined to commits in a given week. Index supports the inner join.
CREATE INDEX IF NOT EXISTS idx_weekly_commit_active_outcome_week
    ON weekly_commit(supporting_outcome_id, plan_id) WHERE active = TRUE;

-- Manager review SLA / time-to-plan rollup queries hit
--   plan.user.manager_id = ? AND plan.week_start_date = ?
-- Direct index on app_user.manager_id is cheaper than denormalising.
CREATE INDEX IF NOT EXISTS idx_app_user_active_manager
    ON app_user(manager_id, active) WHERE manager_id IS NOT NULL;

-- Commit event audit feed lookup by plan, sorted by occurrence — already
-- covered by idx_commit_event_plan_time. Added here for symmetry: lookup
-- by event_type for analytics rollups (e.g. count of LOCK events per team).
CREATE INDEX IF NOT EXISTS idx_commit_event_plan_type
    ON commit_event(plan_id, event_type);

-- Outbox dispatch contention: poller orders by created_at; ensure the partial
-- index (already in V8) is statistics-warmed. ANALYZE is a session-bound op
-- so we run it inside a DO block to make the intent explicit in migration log.
DO $$ BEGIN
    EXECUTE 'ANALYZE weekly_plan';
    EXECUTE 'ANALYZE weekly_commit';
    EXECUTE 'ANALYZE commit_event';
    EXECUTE 'ANALYZE outbox_event';
END $$;
