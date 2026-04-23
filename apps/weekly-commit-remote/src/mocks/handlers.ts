import { http, HttpResponse } from 'msw';

// ---------------------------------------------------------------------------
// IDs — stable UUIDs so the UI can reference them consistently
// ---------------------------------------------------------------------------
const PLAN_ID = '10000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000001';
const TEAM_ID = '00000000-0000-0000-0000-000000000010';

// Chess layers (seeded same as V9__seed.sql)
const CHESS_LAYERS = [
  {
    id: 'cl-offense',
    name: 'Offense',
    description: 'Revenue-generating and growth initiatives',
    color: '#D4603A',
    displayOrder: 1,
    weight: 1,
    isDefault: false,
    active: true,
  },
  {
    id: 'cl-defense',
    name: 'Defense',
    description: 'Protecting existing revenue and mitigating risk',
    color: '#2A9D8F',
    displayOrder: 2,
    weight: 0.8,
    isDefault: false,
    active: true,
  },
  {
    id: 'cl-maintenance',
    name: 'Maintenance',
    description: 'Keeping the lights on — ops, infra, tech debt',
    color: '#6B7280',
    displayOrder: 3,
    weight: 0.5,
    isDefault: true,
    active: true,
  },
  {
    id: 'cl-discovery',
    name: 'Discovery',
    description: 'Research, spikes, and learning investments',
    color: '#7C3AED',
    displayOrder: 4,
    weight: 0.3,
    isDefault: false,
    active: true,
  },
];

// RCDO hierarchy — Rally Cry > Defining Objective > Outcome > Supporting Outcome
const STRATEGIC_TREE = [
  {
    id: 'rc-1',
    type: 'RALLY_CRY',
    parentId: null,
    title: 'Own Enterprise Trust',
    description: 'Primary rally cry for 2026',
    owningTeamId: null,
    active: true,
    activeFrom: '2026-01-01',
    activeUntil: '2026-12-31',
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    children: [
      {
        id: 'do-1',
        type: 'DEFINING_OBJECTIVE',
        parentId: 'rc-1',
        title: 'Enterprise-Grade Compliance',
        description: null,
        owningTeamId: TEAM_ID,
        active: true,
        activeFrom: '2026-01-01',
        activeUntil: null,
        displayOrder: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        children: [
          {
            id: 'o-1',
            type: 'OUTCOME',
            parentId: 'do-1',
            title: 'SOC 2 Type II by Q3',
            description: 'Complete SOC 2 audit and certification',
            owningTeamId: TEAM_ID,
            active: true,
            activeFrom: '2026-01-01',
            activeUntil: null,
            displayOrder: 1,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            children: [
              {
                id: 'so-1',
                type: 'SUPPORTING_OUTCOME',
                parentId: 'o-1',
                title: 'Audit-log v1 in production',
                description: 'Deployed audit-log export for enterprise partners',
                owningTeamId: TEAM_ID,
                active: true,
                activeFrom: '2026-01-01',
                activeUntil: null,
                displayOrder: 1,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                children: [],
              },
            ],
          },
          {
            id: 'o-3',
            type: 'OUTCOME',
            parentId: 'do-1',
            title: 'Customer Incident Response',
            description: null,
            owningTeamId: TEAM_ID,
            active: true,
            activeFrom: '2026-01-01',
            activeUntil: null,
            displayOrder: 2,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            children: [
              {
                id: 'so-4',
                type: 'SUPPORTING_OUTCOME',
                parentId: 'o-3',
                title: 'Tier-1 self-serve incident resolution',
                description: 'Support can resolve SSO/SAML issues without eng',
                owningTeamId: TEAM_ID,
                active: true,
                activeFrom: '2026-01-01',
                activeUntil: null,
                displayOrder: 1,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'do-2',
        type: 'DEFINING_OBJECTIVE',
        parentId: 'rc-1',
        title: 'Enterprise Pipeline',
        description: null,
        owningTeamId: TEAM_ID,
        active: true,
        activeFrom: '2026-01-01',
        activeUntil: null,
        displayOrder: 2,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        children: [
          {
            id: 'o-2',
            type: 'OUTCOME',
            parentId: 'do-2',
            title: '3 Named Logos in POC',
            description: 'Enterprise prospects actively evaluating',
            owningTeamId: TEAM_ID,
            active: true,
            activeFrom: '2026-01-01',
            activeUntil: null,
            displayOrder: 1,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            children: [
              {
                id: 'so-2',
                type: 'SUPPORTING_OUTCOME',
                parentId: 'o-2',
                title: 'Finch onboarded as design partner',
                description: 'Signed POC + provisioned sandbox',
                owningTeamId: TEAM_ID,
                active: true,
                activeFrom: '2026-01-01',
                activeUntil: null,
                displayOrder: 1,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'do-3',
        type: 'DEFINING_OBJECTIVE',
        parentId: 'rc-1',
        title: 'Monetization Step-Up',
        description: null,
        owningTeamId: TEAM_ID,
        active: true,
        activeFrom: '2026-01-01',
        activeUntil: null,
        displayOrder: 3,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        children: [
          {
            id: 'o-4',
            type: 'OUTCOME',
            parentId: 'do-3',
            title: 'New Plan Tiers Validated',
            description: 'Pricing experiment results confirm tier viability',
            owningTeamId: TEAM_ID,
            active: true,
            activeFrom: '2026-01-01',
            activeUntil: null,
            displayOrder: 1,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            children: [
              {
                id: 'so-3',
                type: 'SUPPORTING_OUTCOME',
                parentId: 'o-4',
                title: 'Q3 pricing experiment spec approved',
                description: 'Finance-approved experiment parameters',
                owningTeamId: TEAM_ID,
                active: true,
                activeFrom: '2026-01-01',
                activeUntil: null,
                displayOrder: 1,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'do-4',
        type: 'DEFINING_OBJECTIVE',
        parentId: 'rc-1',
        title: 'Exec Operating Cadence',
        description: null,
        owningTeamId: TEAM_ID,
        active: true,
        activeFrom: '2026-01-01',
        activeUntil: null,
        displayOrder: 4,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        children: [
          {
            id: 'o-5',
            type: 'OUTCOME',
            parentId: 'do-4',
            title: 'Weekly-Commit Adoption > 90%',
            description: 'Company-wide adoption of the weekly commit system',
            owningTeamId: TEAM_ID,
            active: true,
            activeFrom: '2026-01-01',
            activeUntil: null,
            displayOrder: 1,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            children: [
              {
                id: 'so-5',
                type: 'SUPPORTING_OUTCOME',
                parentId: 'o-5',
                title: 'Adoption friction documented and addressed',
                description: 'User research driving iteration on adoption UX',
                owningTeamId: TEAM_ID,
                active: true,
                activeFrom: '2026-01-01',
                activeUntil: null,
                displayOrder: 1,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                children: [],
              },
            ],
          },
          {
            id: 'o-6',
            type: 'OUTCOME',
            parentId: 'do-4',
            title: 'Platform Stability',
            description: null,
            owningTeamId: TEAM_ID,
            active: true,
            activeFrom: '2026-01-01',
            activeUntil: null,
            displayOrder: 2,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            children: [
              {
                id: 'so-6',
                type: 'SUPPORTING_OUTCOME',
                parentId: 'o-6',
                title: 'Dependency currency < 30 days',
                description: 'All deps within 30-day freshness SLA',
                owningTeamId: TEAM_ID,
                active: true,
                activeFrom: '2026-01-01',
                activeUntil: null,
                displayOrder: 1,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Week start = current Monday
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const WEEK_START = currentWeekStart();
const NOW = new Date().toISOString();

// ---------------------------------------------------------------------------
// Mutable state — mutations update this in-memory
// ---------------------------------------------------------------------------
let planState: 'DRAFT' | 'LOCKED' | 'RECONCILING' | 'RECONCILED' = 'DRAFT';
let planVersion = 1;

let commits: any[] = [
  {
    id: 'c-1',
    planId: PLAN_ID,
    title: 'Ship audit-log export beta to 5 design partners',
    rationale: 'Enterprise prospects are blocked on SOC 2 compliance — audit-log export is the #1 ask in every security review.',
    expectedEvidence: 'Link to deployed audit-log endpoint + 2 design-partner tenants using it.',
    supportingOutcomeId: 'so-1',
    chessLayerCategoryId: 'cl-offense',
    priorityRank: 1,
    lockedOutcomePath: null,
    lockedOutcomeTitles: null,
    sourceCommitId: null,
    carryGeneration: 0,
    requiresManagerAck: false,
    active: true,
    reconciliation: null,
    version: 1,
    createdAt: '2026-04-21T09:00:00Z',
    updatedAt: '2026-04-21T09:00:00Z',
  },
  {
    id: 'c-2',
    planId: PLAN_ID,
    title: 'Draft Q3 pricing experiment spec with Finance',
    rationale: 'Need sign-off on experiment parameters before eng starts instrumentation. Finance review window closes Friday.',
    expectedEvidence: 'Published spec doc with Finance sign-off comment.',
    supportingOutcomeId: 'so-3',
    chessLayerCategoryId: 'cl-discovery',
    priorityRank: 1,
    lockedOutcomePath: null,
    lockedOutcomeTitles: null,
    sourceCommitId: null,
    carryGeneration: 0,
    requiresManagerAck: false,
    active: true,
    reconciliation: null,
    version: 1,
    createdAt: '2026-04-21T09:15:00Z',
    updatedAt: '2026-04-21T09:15:00Z',
  },
  {
    id: 'c-3',
    planId: PLAN_ID,
    title: 'Onboard Finch as enterprise design partner',
    rationale: 'Finch is the strongest logo in the pipeline. Getting them into a POC this week de-risks the Q2 pipeline target.',
    expectedEvidence: 'Signed POC agreement + sandbox tenant provisioned.',
    supportingOutcomeId: 'so-2',
    chessLayerCategoryId: 'cl-offense',
    priorityRank: 2,
    lockedOutcomePath: null,
    lockedOutcomeTitles: null,
    sourceCommitId: null,
    carryGeneration: 0,
    requiresManagerAck: false,
    active: true,
    reconciliation: null,
    version: 1,
    createdAt: '2026-04-21T10:00:00Z',
    updatedAt: '2026-04-21T10:00:00Z',
  },
  {
    id: 'c-4',
    planId: PLAN_ID,
    title: 'Finish SSO/SAML runbook for Support',
    rationale: 'Support escalations on SSO take 4h avg because there is no runbook. This blocks Tier-1 self-serve.',
    expectedEvidence: 'Runbook merged to internal docs + walkthrough with Support lead.',
    supportingOutcomeId: 'so-4',
    chessLayerCategoryId: 'cl-defense',
    priorityRank: 2,
    lockedOutcomePath: null,
    lockedOutcomeTitles: null,
    sourceCommitId: null,
    carryGeneration: 0,
    requiresManagerAck: false,
    active: true,
    reconciliation: null,
    version: 1,
    createdAt: '2026-04-21T10:30:00Z',
    updatedAt: '2026-04-21T10:30:00Z',
  },
  {
    id: 'c-5',
    planId: PLAN_ID,
    title: 'Quarterly dependency refresh on api-client package',
    rationale: 'Dependency currency is drifting past the 30-day SLA. Two CVEs in transitive deps need patching.',
    expectedEvidence: 'PR merged with zero test regressions + CVE fixes verified.',
    supportingOutcomeId: 'so-6',
    chessLayerCategoryId: 'cl-maintenance',
    priorityRank: 3,
    lockedOutcomePath: null,
    lockedOutcomeTitles: null,
    sourceCommitId: null,
    carryGeneration: 0,
    requiresManagerAck: false,
    active: true,
    reconciliation: null,
    version: 1,
    createdAt: '2026-04-21T11:00:00Z',
    updatedAt: '2026-04-21T11:00:00Z',
  },
  {
    id: 'c-6',
    planId: PLAN_ID,
    title: 'User interviews (3) on weekly-commit adoption friction',
    rationale: null,
    expectedEvidence: null,
    supportingOutcomeId: null,
    chessLayerCategoryId: null,
    priorityRank: 3,
    lockedOutcomePath: null,
    lockedOutcomeTitles: null,
    sourceCommitId: 'c-prev-7',
    carryGeneration: 2,
    requiresManagerAck: false,
    active: true,
    reconciliation: null,
    version: 1,
    createdAt: '2026-04-21T11:30:00Z',
    updatedAt: '2026-04-21T11:30:00Z',
  },
];

function buildPlan() {
  return {
    id: PLAN_ID,
    userId: USER_ID,
    userDisplayName: 'Jackie Chan',
    weekStartDate: WEEK_START,
    state: planState,
    draftedAt: '2026-04-21T08:45:00Z',
    lockedAt: planState !== 'DRAFT' ? '2026-04-21T17:00:00Z' : null,
    reconciliationStartedAt: planState === 'RECONCILING' || planState === 'RECONCILED' ? '2026-04-25T09:00:00Z' : null,
    reconciledAt: planState === 'RECONCILED' ? '2026-04-25T16:00:00Z' : null,
    reviewedAt: null,
    version: planVersion,
    commits,
    review: null,
  };
}

// Activity feed entries
const ACTIVITY = [
  { id: 'a-1', planId: PLAN_ID, commitId: null, eventType: 'PLAN_CREATED', actor: 'Jackie Chan', occurredAt: '2026-04-21T08:45:00Z', payload: null },
  { id: 'a-2', planId: PLAN_ID, commitId: 'c-1', eventType: 'COMMIT_ADDED', actor: 'Jackie Chan', occurredAt: '2026-04-21T09:00:00Z', payload: null },
  { id: 'a-3', planId: PLAN_ID, commitId: 'c-2', eventType: 'COMMIT_ADDED', actor: 'Jackie Chan', occurredAt: '2026-04-21T09:15:00Z', payload: null },
  { id: 'a-4', planId: PLAN_ID, commitId: 'c-3', eventType: 'COMMIT_ADDED', actor: 'Jackie Chan', occurredAt: '2026-04-21T10:00:00Z', payload: null },
  { id: 'a-5', planId: PLAN_ID, commitId: 'c-4', eventType: 'COMMIT_ADDED', actor: 'Jackie Chan', occurredAt: '2026-04-21T10:30:00Z', payload: null },
  { id: 'a-6', planId: PLAN_ID, commitId: 'c-5', eventType: 'COMMIT_ADDED', actor: 'Jackie Chan', occurredAt: '2026-04-21T11:00:00Z', payload: null },
  { id: 'a-7', planId: PLAN_ID, commitId: 'c-6', eventType: 'COMMIT_CARRIED_FORWARD', actor: 'system', occurredAt: '2026-04-21T11:30:00Z', payload: null },
  { id: 'a-8', planId: PLAN_ID, commitId: 'c-1', eventType: 'COMMIT_UPDATED', actor: 'Jackie Chan', occurredAt: '2026-04-22T14:20:00Z', payload: null },
];

// Team rollup for manager queue
const ROLLUP = {
  teamId: TEAM_ID,
  weekStartDate: WEEK_START,
  totalReports: 8,
  alignmentPercent: 92,
  planningCompletionPercent: 88,
  reconciliationAccuracyPercent: 76,
  reviewSlaMetPercent: 95,
  carryForwardRate: 18,
  timeToPlanMedianMinutes: 23,
  outcomeCoverageCount: 6,
};

// 8-week trend data for sparklines
function weeksBefore(n: number): string {
  const d = new Date(WEEK_START + 'T00:00:00');
  d.setDate(d.getDate() - n * 7);
  return d.toISOString().slice(0, 10);
}

const ROLLUP_HISTORY = [
  { weekStartDate: weeksBefore(7), alignmentPercent: 78, lockRate: 70, reviewSlaPercent: 80, carryRate: 28 },
  { weekStartDate: weeksBefore(6), alignmentPercent: 81, lockRate: 75, reviewSlaPercent: 82, carryRate: 25 },
  { weekStartDate: weeksBefore(5), alignmentPercent: 84, lockRate: 80, reviewSlaPercent: 88, carryRate: 22 },
  { weekStartDate: weeksBefore(4), alignmentPercent: 86, lockRate: 82, reviewSlaPercent: 90, carryRate: 20 },
  { weekStartDate: weeksBefore(3), alignmentPercent: 88, lockRate: 85, reviewSlaPercent: 91, carryRate: 19 },
  { weekStartDate: weeksBefore(2), alignmentPercent: 90, lockRate: 86, reviewSlaPercent: 93, carryRate: 17 },
  { weekStartDate: weeksBefore(1), alignmentPercent: 91, lockRate: 87, reviewSlaPercent: 94, carryRate: 18 },
  { weekStartDate: WEEK_START, alignmentPercent: 92, lockRate: 88, reviewSlaPercent: 95, carryRate: 18 },
];

// Exception cards for manager queue
const EXCEPTIONS = [
  {
    id: 'ex-1',
    type: 'OVERDUE_LOCK',
    detectedAt: NOW,
    severity: 'critical',
    reportUserId: 'u-sarah',
    reportUserDisplayName: 'Sarah Mitchell',
    weekStartDate: WEEK_START,
    hoursOverdue: 14,
  },
  {
    id: 'ex-2',
    type: 'REPEATED_CARRY_FORWARD',
    detectedAt: NOW,
    severity: 'warning',
    reportUserId: 'u-devon',
    reportUserDisplayName: 'Devon Park',
    commitId: 'c-ext-1',
    commitTitle: 'Migrate legacy auth to OIDC',
    carryGeneration: 3,
    rootCommitId: 'c-ext-root',
  },
  {
    id: 'ex-3',
    type: 'OUTCOME_COVERAGE_GAP',
    detectedAt: NOW,
    severity: 'warning',
    reportUserId: USER_ID,
    reportUserDisplayName: 'System',
    outcomeId: 'so-4',
    outcomeTitle: 'Deploy Customer Health Scoring',
    weeksUncovered: 3,
  },
  {
    id: 'ex-4',
    type: 'PENDING_REVIEW_SLA',
    detectedAt: NOW,
    severity: 'info',
    reportUserId: 'u-alex',
    reportUserDisplayName: 'Alex Reyes',
    planId: 'plan-ext-2',
    weekStartDate: WEEK_START,
    hoursPending: 52,
  },
  {
    id: 'ex-5',
    type: 'BLOCKED_HIGH_PRIORITY',
    detectedAt: NOW,
    severity: 'critical',
    reportUserId: 'u-morgan',
    reportUserDisplayName: 'Morgan Liu',
    commitId: 'c-ext-3',
    commitTitle: 'Ship enterprise SSO integration',
    priorityRank: 1,
    deltaReason: 'Blocked on legal review of SAML contract amendment',
  },
];

// ---------------------------------------------------------------------------
// MSW handlers
// ---------------------------------------------------------------------------
export const handlers = [
  // ── Plans ──────────────────────────────────────────────
  http.get('/api/plans/me/current', () => {
    return HttpResponse.json(buildPlan());
  }),

  http.get('/api/plans/:id', ({ params }) => {
    if (params.id === PLAN_ID) return HttpResponse.json(buildPlan());
    return HttpResponse.json({ message: 'Not found' }, { status: 404 });
  }),

  http.post('/api/plans', async ({ request }) => {
    const body = (await request.json()) as { weekStartDate: string };
    planState = 'DRAFT';
    return HttpResponse.json({ ...buildPlan(), weekStartDate: body.weekStartDate }, { status: 201 });
  }),

  http.post('/api/plans/:id/lock', () => {
    // Validate all commits have required fields
    const errors: { commitId: string; field: string; message: string }[] = [];
    for (const c of commits.filter((x) => x.active)) {
      if (!c.supportingOutcomeId) errors.push({ commitId: c.id, field: 'supportingOutcome', message: 'Outcome is required' });
      if (!c.chessLayerCategoryId) errors.push({ commitId: c.id, field: 'chessLayer', message: 'Chess layer is required' });
      if (!c.expectedEvidence) errors.push({ commitId: c.id, field: 'expectedEvidence', message: 'Expected evidence is required' });
    }
    if (errors.length > 0) {
      return HttpResponse.json({ message: 'Validation failed', errors }, { status: 422 });
    }
    planState = 'LOCKED';
    planVersion++;
    return HttpResponse.json(buildPlan());
  }),

  http.post('/api/plans/:id/start-reconciliation', () => {
    planState = 'RECONCILING';
    planVersion++;
    return HttpResponse.json(buildPlan());
  }),

  http.post('/api/plans/:id/reconcile', async ({ request }) => {
    const body = (await request.json()) as { reconciliations: { commitId: string; status: string; actualOutcome?: string; deltaReason?: string; carryDecision?: string; carryRationale?: string }[] };
    for (const r of body.reconciliations) {
      const c = commits.find((x) => x.id === r.commitId);
      if (c) {
        c.reconciliation = {
          id: `rec-${c.id}`,
          commitId: c.id,
          status: r.status as 'DELIVERED' | 'PARTIAL' | 'MISSED',
          actualOutcome: r.actualOutcome ?? null,
          deltaReason: r.deltaReason ?? null,
          carryDecision: (r.carryDecision as 'DROP' | 'FINISHED_NEXT_WEEK' | 'CARRY_FORWARD') ?? null,
          carryRationale: r.carryRationale ?? null,
          nextCommitId: null,
          reconciledAt: new Date().toISOString(),
        };
      }
    }
    planState = 'RECONCILED';
    planVersion++;
    return HttpResponse.json(buildPlan());
  }),

  // Lock preview
  http.get('/api/plans/:id/lock-preview', () => {
    const errors: { commitId: string; field: string; message: string }[] = [];
    for (const c of commits.filter((x) => x.active)) {
      if (!c.supportingOutcomeId) errors.push({ commitId: c.id, field: 'supportingOutcome', message: 'Outcome is required' });
      if (!c.chessLayerCategoryId) errors.push({ commitId: c.id, field: 'chessLayer', message: 'Chess layer is required' });
      if (!c.expectedEvidence) errors.push({ commitId: c.id, field: 'expectedEvidence', message: 'Expected evidence is required' });
    }
    return HttpResponse.json({ canLock: errors.length === 0, errors });
  }),

  // ── Commits ────────────────────────────────────────────
  http.post('/api/plans/:planId/commits', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newCommit = {
      id: `c-${Date.now()}`,
      planId: PLAN_ID,
      title: (body.title as string) || '',
      rationale: (body.rationale as string) || null,
      expectedEvidence: (body.expectedEvidence as string) || null,
      supportingOutcomeId: (body.supportingOutcomeId as string) || null,
      chessLayerCategoryId: (body.chessLayerCategoryId as string) || null,
      priorityRank: (body.priorityRank as number) ?? commits.length + 1,
      lockedOutcomePath: null,
      lockedOutcomeTitles: null,
      sourceCommitId: null,
      carryGeneration: 0,
      requiresManagerAck: false,
      active: true,
      reconciliation: null,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    commits.push(newCommit);
    return HttpResponse.json(newCommit, { status: 201 });
  }),

  http.put('/api/commits/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const c = commits.find((x) => x.id === params.id);
    if (!c) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    c.title = (body.title as string) ?? c.title;
    c.rationale = (body.rationale as string) ?? c.rationale;
    c.expectedEvidence = (body.expectedEvidence as string) ?? c.expectedEvidence;
    c.supportingOutcomeId = (body.supportingOutcomeId as string) ?? c.supportingOutcomeId;
    c.chessLayerCategoryId = (body.chessLayerCategoryId as string) ?? c.chessLayerCategoryId;
    c.priorityRank = (body.priorityRank as number) ?? c.priorityRank;
    c.version++;
    c.updatedAt = new Date().toISOString();
    return HttpResponse.json(c);
  }),

  http.delete('/api/commits/:id', ({ params }) => {
    commits = commits.filter((c) => c.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Reference data ─────────────────────────────────────
  http.get('/api/chess-layers', () => {
    return HttpResponse.json(CHESS_LAYERS);
  }),

  http.get('/api/strategic-nodes/tree', () => {
    return HttpResponse.json(STRATEGIC_TREE);
  }),

  // ── Activity ───────────────────────────────────────────
  http.get('/api/plans/:id/activity', () => {
    return HttpResponse.json(ACTIVITY);
  }),

  // ── Team / Manager endpoints ───────────────────────────
  http.get('/api/teams/:teamId/exceptions', () => {
    return HttpResponse.json({
      rollup: ROLLUP,
      exceptions: {
        content: EXCEPTIONS,
        totalElements: EXCEPTIONS.length,
        totalPages: 1,
        size: 50,
        number: 0,
        first: true,
        last: true,
        empty: false,
      },
    });
  }),

  http.get('/api/teams/:teamId/rollup/history', () => {
    return HttpResponse.json(ROLLUP_HISTORY);
  }),

  // ── AI suggest ─────────────────────────────────────────
  http.post('/api/ai/suggest-title', async ({ request }) => {
    const body = (await request.json()) as { context?: string };
    return HttpResponse.json({
      suggestion: body.context
        ? `Implement ${body.context.slice(0, 40).toLowerCase()}`
        : 'Ship feature improvement by Friday',
    });
  }),
];
