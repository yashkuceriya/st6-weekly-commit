-- V2 — Chess layer = admin-configurable categorisation/prioritisation taxonomy.
--
-- Brief is silent on exact semantics. Modelled here as a reference table per
-- second-research recommendation, not hardcoded king/queen/bishop. Affects
-- both display ordering and reporting weight.

CREATE TABLE chess_layer_category (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(60)     NOT NULL UNIQUE,
    description     TEXT,
    color           VARCHAR(7)      NOT NULL DEFAULT '#D97757',
    display_order   INTEGER         NOT NULL DEFAULT 0,
    weight          NUMERIC(3,2)    NOT NULL DEFAULT 1.00 CHECK (weight >= 0.00 AND weight <= 1.00),
    is_default      BOOLEAN         NOT NULL DEFAULT FALSE,
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    version         BIGINT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by      VARCHAR(120)    NOT NULL DEFAULT 'system',
    updated_by      VARCHAR(120)    NOT NULL DEFAULT 'system'
);

CREATE UNIQUE INDEX idx_chess_layer_default
    ON chess_layer_category((1)) WHERE is_default = TRUE;

CREATE INDEX idx_chess_layer_display_order ON chess_layer_category(display_order, name);
