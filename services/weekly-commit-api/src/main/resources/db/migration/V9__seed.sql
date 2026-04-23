-- V9 — Demo seed data.
--
-- 2 teams, 1 admin, 3 managers, 12 ICs, 4 chess categories, full RCDO hierarchy
-- (1 Rally Cry → 4 Defining Objectives → 12 Outcomes → 30 Supporting Outcomes).
-- Used in dev + the Cypress BDD specs. Production ships without this file
-- via Flyway location override.

-- ──────────────────────────────────────────────────────────────────────────
-- Teams
INSERT INTO team (id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000010', 'Engineering', 'Builds the product'),
    ('00000000-0000-0000-0000-000000000011', 'Customer Success', 'Keeps customers winning');

-- Users — admin, managers, ICs.
INSERT INTO app_user (id, email, display_name, manager_id, team_id, is_manager, is_admin) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@st6.local', 'Aria Admin', NULL, NULL, FALSE, TRUE),
    -- Managers
    ('00000000-0000-0000-0000-000000000101', 'morgan.chen@st6.local', 'Morgan Chen', NULL, '00000000-0000-0000-0000-000000000010', TRUE, FALSE),
    ('00000000-0000-0000-0000-000000000102', 'priya.shah@st6.local', 'Priya Shah', NULL, '00000000-0000-0000-0000-000000000010', TRUE, FALSE),
    ('00000000-0000-0000-0000-000000000103', 'theo.jensen@st6.local', 'Theo Jensen', NULL, '00000000-0000-0000-0000-000000000011', TRUE, FALSE),
    -- ICs under Morgan
    ('00000000-0000-0000-0000-000000000201', 'lin.park@st6.local', 'Lin Park', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000202', 'jamie.ortiz@st6.local', 'Jamie Ortiz', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000203', 'sasha.kim@st6.local', 'Sasha Kim', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000204', 'reza.malik@st6.local', 'Reza Malik', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', FALSE, FALSE),
    -- ICs under Priya
    ('00000000-0000-0000-0000-000000000205', 'kira.nguyen@st6.local', 'Kira Nguyen', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000206', 'alex.rao@st6.local', 'Alex Rao', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000207', 'noor.haddad@st6.local', 'Noor Haddad', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000208', 'devin.ross@st6.local', 'Devin Ross', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', FALSE, FALSE),
    -- ICs under Theo
    ('00000000-0000-0000-0000-000000000209', 'sven.larsen@st6.local', 'Sven Larsen', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000011', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000210', 'mira.bauer@st6.local', 'Mira Bauer', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000011', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000211', 'tariq.amin@st6.local', 'Tariq Amin', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000011', FALSE, FALSE),
    ('00000000-0000-0000-0000-000000000212', 'eve.salazar@st6.local', 'Eve Salazar', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000011', FALSE, FALSE),
    -- The dev fallback user (matches PermissiveAuthenticationFilter default)
    ('00000000-0000-0000-0000-0000000000ff', 'dev-ic@st6.local', 'Dev IC', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', FALSE, FALSE);

-- ──────────────────────────────────────────────────────────────────────────
-- Chess layer categories
INSERT INTO chess_layer_category (id, name, description, color, display_order, weight, is_default) VALUES
    ('00000000-0000-0000-0000-000000000301', 'Offense',     'New growth, expansion, capture',           '#D97757', 1, 1.00, TRUE),
    ('00000000-0000-0000-0000-000000000302', 'Defense',     'Retention, risk reduction, hardening',     '#5C8A4F', 2, 0.90, FALSE),
    ('00000000-0000-0000-0000-000000000303', 'Maintenance', 'Keep-the-lights-on, ops, quality',         '#928A75', 3, 0.50, FALSE),
    ('00000000-0000-0000-0000-000000000304', 'Discovery',   'Research, prototyping, learning bets',     '#C68A2E', 4, 0.70, FALSE);

-- ──────────────────────────────────────────────────────────────────────────
-- Strategic hierarchy: Rally Cry → 4 Defining Objectives → 12 Outcomes → 30 Supporting Outcomes
-- Rally Cry
INSERT INTO strategic_node (id, type, parent_id, title, description, owning_team_id, display_order) VALUES
    ('00000000-0000-0000-0000-000000001000', 'RALLY_CRY', NULL,
     'Win Q2 in mid-market',
     'Become the default execution operating system for mid-market strategy teams by end of Q2.',
     NULL, 1);

-- Defining Objectives
INSERT INTO strategic_node (id, type, parent_id, title, owning_team_id, display_order) VALUES
    ('00000000-0000-0000-0000-000000002001', 'DEFINING_OBJECTIVE', '00000000-0000-0000-0000-000000001000', 'Activate 50 mid-market accounts',         '00000000-0000-0000-0000-000000000010', 1),
    ('00000000-0000-0000-0000-000000002002', 'DEFINING_OBJECTIVE', '00000000-0000-0000-0000-000000001000', 'Reach 90% weekly planner adoption',        '00000000-0000-0000-0000-000000000011', 2),
    ('00000000-0000-0000-0000-000000002003', 'DEFINING_OBJECTIVE', '00000000-0000-0000-0000-000000001000', 'Cut planning-cycle time by 40%',           '00000000-0000-0000-0000-000000000010', 3),
    ('00000000-0000-0000-0000-000000002004', 'DEFINING_OBJECTIVE', '00000000-0000-0000-0000-000000001000', 'Earn one customer-of-record reference',    '00000000-0000-0000-0000-000000000011', 4);

-- Outcomes (3 per Defining Objective)
INSERT INTO strategic_node (id, type, parent_id, title, display_order) VALUES
    ('00000000-0000-0000-0000-000000003001', 'OUTCOME', '00000000-0000-0000-0000-000000002001', 'Sales pipeline: 200 qualified opps',           1),
    ('00000000-0000-0000-0000-000000003002', 'OUTCOME', '00000000-0000-0000-0000-000000002001', 'Activation playbook in production',            2),
    ('00000000-0000-0000-0000-000000003003', 'OUTCOME', '00000000-0000-0000-0000-000000002001', 'Self-serve trial conversion ≥ 25%',            3),

    ('00000000-0000-0000-0000-000000003004', 'OUTCOME', '00000000-0000-0000-0000-000000002002', 'Weekly lock rate ≥ 95%',                       1),
    ('00000000-0000-0000-0000-000000003005', 'OUTCOME', '00000000-0000-0000-0000-000000002002', 'Manager review SLA met ≥ 90%',                 2),
    ('00000000-0000-0000-0000-000000003006', 'OUTCOME', '00000000-0000-0000-0000-000000002002', 'NPS of weekly ritual ≥ 40',                    3),

    ('00000000-0000-0000-0000-000000003007', 'OUTCOME', '00000000-0000-0000-0000-000000002003', 'Median time-to-plan ≤ 9 minutes',              1),
    ('00000000-0000-0000-0000-000000003008', 'OUTCOME', '00000000-0000-0000-0000-000000002003', 'Reconciliation completion ≥ 90%',              2),
    ('00000000-0000-0000-0000-000000003009', 'OUTCOME', '00000000-0000-0000-0000-000000002003', 'Carry-forward rate ≤ 15%',                     3),

    ('00000000-0000-0000-0000-000000003010', 'OUTCOME', '00000000-0000-0000-0000-000000002004', 'Reference customer signed',                    1),
    ('00000000-0000-0000-0000-000000003011', 'OUTCOME', '00000000-0000-0000-0000-000000002004', 'Case study published',                         2),
    ('00000000-0000-0000-0000-000000003012', 'OUTCOME', '00000000-0000-0000-0000-000000002004', '3 podcast appearances secured',                3);

-- Supporting Outcomes (commits link here). Roughly 2-3 per Outcome.
INSERT INTO strategic_node (id, type, parent_id, title, display_order) VALUES
    ('00000000-0000-0000-0000-000000004001', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003001', 'Build outbound campaign for fintech vertical',  1),
    ('00000000-0000-0000-0000-000000004002', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003001', 'Refresh discovery deck',                        2),
    ('00000000-0000-0000-0000-000000004003', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003001', 'Land partnership with CFO Connect',             3),

    ('00000000-0000-0000-0000-000000004004', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003002', 'Ship guided onboarding wizard',                 1),
    ('00000000-0000-0000-0000-000000004005', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003002', 'Sample dataset & demo workspace',               2),

    ('00000000-0000-0000-0000-000000004006', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003003', 'Trial → paid funnel A/B test',                  1),
    ('00000000-0000-0000-0000-000000004007', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003003', 'Pricing experiment for SMB tier',               2),

    ('00000000-0000-0000-0000-000000004008', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003004', 'Lock-by-Tuesday nudge experiment',              1),
    ('00000000-0000-0000-0000-000000004009', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003004', 'Outlook focus-block integration',               2),
    ('00000000-0000-0000-0000-000000004010', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003004', 'Mobile draft entry',                            3),

    ('00000000-0000-0000-0000-000000004011', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003005', 'Manager exception queue v2',                    1),
    ('00000000-0000-0000-0000-000000004012', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003005', 'SLA digest email',                              2),
    ('00000000-0000-0000-0000-000000004013', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003005', 'Slack escalation bot',                          3),

    ('00000000-0000-0000-0000-000000004014', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003006', 'Q2 NPS survey wave',                            1),
    ('00000000-0000-0000-0000-000000004015', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003006', 'Coaching tips for low-NPS managers',            2),

    ('00000000-0000-0000-0000-000000004016', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003007', 'Smart commit drafting (templates)',             1),
    ('00000000-0000-0000-0000-000000004017', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003007', 'Carry-forward seed flow',                       2),
    ('00000000-0000-0000-0000-000000004018', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003007', 'Strategic node search experience',              3),

    ('00000000-0000-0000-0000-000000004019', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003008', 'Friday reconciliation reminder cron',           1),
    ('00000000-0000-0000-0000-000000004020', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003008', 'Reconciliation accuracy coaching report',       2),

    ('00000000-0000-0000-0000-000000004021', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003009', 'Carry-forward escalation rule',                 1),
    ('00000000-0000-0000-0000-000000004022', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003009', 'Manager-ack flag UX',                           2),
    ('00000000-0000-0000-0000-000000004023', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003009', 'Carry-forward retrospective dashboard',         3),

    ('00000000-0000-0000-0000-000000004024', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003010', 'Procurement-ready security packet',             1),
    ('00000000-0000-0000-0000-000000004025', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003010', 'Reference call playbook',                       2),

    ('00000000-0000-0000-0000-000000004026', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003011', 'Customer interview series',                     1),
    ('00000000-0000-0000-0000-000000004027', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003011', 'Visual storytelling refresh',                   2),

    ('00000000-0000-0000-0000-000000004028', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003012', 'Operator-to-operator podcast tour',             1),
    ('00000000-0000-0000-0000-000000004029', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003012', 'Earned-media deck refresh',                     2),
    ('00000000-0000-0000-0000-000000004030', 'SUPPORTING_OUTCOME', '00000000-0000-0000-0000-000000003012', 'Post-podcast follow-up automation',             3);
