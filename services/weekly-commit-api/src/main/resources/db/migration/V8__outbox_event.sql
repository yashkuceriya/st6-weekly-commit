-- V8 — Transactional outbox for async fanout (notifications, integrations,
-- analytics). State transitions write outbox rows in the same DB transaction
-- as the state change; a scheduled poller publishes them.
--
-- For the take-home: the publisher is in-process (Spring ApplicationEventPublisher).
-- For prod: swap to SNS/SQS without changing the write side. See CLAUDE.md.

CREATE TABLE outbox_event (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type  VARCHAR(64)     NOT NULL,
    aggregate_id    UUID            NOT NULL,
    event_type      VARCHAR(64)     NOT NULL,
    payload         JSONB           NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    published_at    TIMESTAMPTZ,
    attempts        INTEGER         NOT NULL DEFAULT 0,
    last_error      TEXT
);

-- Hot path: pick up unpublished events in age order. Partial index keeps it
-- tiny since published rows are the bulk of the table over time.
CREATE INDEX idx_outbox_unpublished
    ON outbox_event(created_at) WHERE published_at IS NULL;

CREATE INDEX idx_outbox_aggregate ON outbox_event(aggregate_type, aggregate_id);
