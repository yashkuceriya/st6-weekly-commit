-- V1 — Strategic node hierarchy (RCDO).
--
-- Single polymorphic table with `type` discriminator + self-referential
-- `parent_id`. Avoids the four-tables-with-identical-shape pain. Recursive
-- CTE traversal in repository code includes a path[] guard against cycles —
-- additionally enforced here at insert/update time via a trigger.

CREATE TYPE strategic_node_type AS ENUM (
    'RALLY_CRY',
    'DEFINING_OBJECTIVE',
    'OUTCOME',
    'SUPPORTING_OUTCOME'
);

CREATE TABLE team (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120)    NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by      VARCHAR(120)    NOT NULL DEFAULT 'system',
    updated_by      VARCHAR(120)    NOT NULL DEFAULT 'system'
);

CREATE TABLE app_user (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(160)    NOT NULL UNIQUE,
    display_name    VARCHAR(160)    NOT NULL,
    manager_id      UUID            REFERENCES app_user(id),
    team_id         UUID            REFERENCES team(id),
    is_manager      BOOLEAN         NOT NULL DEFAULT FALSE,
    is_admin        BOOLEAN         NOT NULL DEFAULT FALSE,
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by      VARCHAR(120)    NOT NULL DEFAULT 'system',
    updated_by      VARCHAR(120)    NOT NULL DEFAULT 'system'
);

CREATE INDEX idx_app_user_manager ON app_user(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX idx_app_user_team ON app_user(team_id) WHERE team_id IS NOT NULL;

CREATE TABLE strategic_node (
    id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    type            strategic_node_type     NOT NULL,
    parent_id       UUID                    REFERENCES strategic_node(id),
    title           VARCHAR(240)            NOT NULL,
    description     TEXT,
    owning_team_id  UUID                    REFERENCES team(id),
    active          BOOLEAN                 NOT NULL DEFAULT TRUE,
    active_from     DATE                    NOT NULL DEFAULT current_date,
    active_until    DATE,
    display_order   INTEGER                 NOT NULL DEFAULT 0,
    version         BIGINT                  NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ             NOT NULL DEFAULT now(),
    created_by      VARCHAR(120)            NOT NULL DEFAULT 'system',
    updated_by      VARCHAR(120)            NOT NULL DEFAULT 'system',

    CONSTRAINT chk_strategic_node_root_type
        CHECK ((parent_id IS NULL) = (type = 'RALLY_CRY')),
    CONSTRAINT chk_strategic_node_active_window
        CHECK (active_until IS NULL OR active_until >= active_from)
);

CREATE INDEX idx_strategic_node_parent ON strategic_node(parent_id);
CREATE INDEX idx_strategic_node_type ON strategic_node(type);
CREATE INDEX idx_strategic_node_active ON strategic_node(active) WHERE active = TRUE;
CREATE INDEX idx_strategic_node_owning_team ON strategic_node(owning_team_id) WHERE owning_team_id IS NOT NULL;

-- Cycle guard for the hierarchy. The single-table self-FK cannot prevent
-- cycles on its own; this trigger walks parents and refuses an insert/update
-- that would close the loop. PostgreSQL warns explicitly that recursive CTE
-- traversal must guard against cycles, so we belt-and-braces both layers.
CREATE OR REPLACE FUNCTION strategic_node_no_cycle() RETURNS TRIGGER AS $$
DECLARE
    cursor_id UUID := NEW.parent_id;
    seen UUID[] := ARRAY[NEW.id]::UUID[];
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    WHILE cursor_id IS NOT NULL LOOP
        IF cursor_id = ANY(seen) THEN
            RAISE EXCEPTION 'Cycle detected in strategic_node hierarchy at %', NEW.id;
        END IF;
        seen := seen || cursor_id;
        SELECT parent_id INTO cursor_id FROM strategic_node WHERE id = cursor_id;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_strategic_node_no_cycle
    BEFORE INSERT OR UPDATE OF parent_id ON strategic_node
    FOR EACH ROW EXECUTE FUNCTION strategic_node_no_cycle();
