import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { WeeklyPlan, WeeklyCommit } from '@st6/shared-types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
const mockUseGetCurrentPlanQuery = vi.fn();
const mockUseGetChessLayersQuery = vi.fn();
const mockUseStartReconciliationMutation = vi.fn();
const mockUseReconcilePlanMutation = vi.fn();

vi.mock('@st6/api-client', () => ({
  useGetCurrentPlanQuery: (...args: unknown[]) => mockUseGetCurrentPlanQuery(...args),
  useGetChessLayersQuery: (...args: unknown[]) => mockUseGetChessLayersQuery(...args),
  useStartReconciliationMutation: (...args: unknown[]) => mockUseStartReconciliationMutation(...args),
  useReconcilePlanMutation: (...args: unknown[]) => mockUseReconcilePlanMutation(...args),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// ---------------------------------------------------------------------------
// Import the component under test AFTER mocks
// ---------------------------------------------------------------------------
import { ReconciliationPage } from '../ReconciliationPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeCommit(overrides: Partial<WeeklyCommit> = {}): WeeklyCommit {
  return {
    id: 'commit-1',
    planId: 'plan-1',
    title: 'Ship login flow',
    rationale: 'Critical path item',
    expectedEvidence: 'Login e2e test passes',
    supportingOutcomeId: 'so-1',
    chessLayerCategoryId: 'cl-1',
    priorityRank: 1,
    lockedOutcomePath: 'Rally Cry > DO > Outcome > SO',
    lockedOutcomeTitles: null,
    sourceCommitId: null,
    carryGeneration: 0,
    requiresManagerAck: false,
    active: true,
    reconciliation: null,
    version: 0,
    createdAt: '2026-04-20T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
    ...overrides,
  };
}

function makePlan(overrides: Partial<WeeklyPlan> = {}): WeeklyPlan {
  return {
    id: 'plan-1',
    userId: 'user-1',
    userDisplayName: 'Test User',
    weekStartDate: '2026-04-20',
    state: 'DRAFT',
    draftedAt: '2026-04-20T00:00:00Z',
    lockedAt: null,
    reconciliationStartedAt: null,
    reconciledAt: null,
    reviewedAt: null,
    version: 0,
    commits: [],
    review: null,
    ...overrides,
  };
}

const mutationTuple = [vi.fn(), { isLoading: false }] as const;

beforeEach(() => {
  vi.clearAllMocks();

  mockUseGetCurrentPlanQuery.mockReturnValue({ data: undefined, isLoading: false });
  mockUseGetChessLayersQuery.mockReturnValue({ data: [] });
  mockUseStartReconciliationMutation.mockReturnValue(mutationTuple);
  mockUseReconcilePlanMutation.mockReturnValue(mutationTuple);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ReconciliationPage', () => {
  it('renders loading spinner while data is loading', () => {
    mockUseGetCurrentPlanQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(<ReconciliationPage />);

    const spinner = container.querySelector('.animate-spin') ?? screen.queryByRole('status');
    expect(spinner).toBeTruthy();
  });

  it('shows "lock first" message for DRAFT plan', () => {
    const plan = makePlan({ state: 'DRAFT' });
    mockUseGetCurrentPlanQuery.mockReturnValue({ data: plan, isLoading: false });

    render(<ReconciliationPage />);

    expect(
      screen.getByText(/lock your plan first/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Back to planner')).toBeInTheDocument();
  });

  it('shows reconciliation form for RECONCILING plan', () => {
    const plan = makePlan({
      state: 'RECONCILING',
      reconciliationStartedAt: '2026-04-24T14:00:00Z',
      lockedAt: '2026-04-21T10:00:00Z',
      commits: [
        makeCommit({ id: 'c1', title: 'Ship login flow' }),
        makeCommit({ id: 'c2', title: 'Fix dashboard layout' }),
      ],
    });
    mockUseGetCurrentPlanQuery.mockReturnValue({ data: plan, isLoading: false });

    render(<ReconciliationPage />);

    // Section header for reconciling state
    expect(screen.getByText('Reconcile your week')).toBeInTheDocument();
    // Submit buttons (one in header actions, one at bottom of page)
    const submitButtons = screen.getAllByText('Submit reconciliation');
    expect(submitButtons.length).toBeGreaterThanOrEqual(1);
    // Commit titles visible in the reconciliation rows (within h3 that also
    // contains a "#N" priority prefix, so use regex substring match)
    expect(screen.getByText(/Ship login flow/)).toBeInTheDocument();
    expect(screen.getByText(/Fix dashboard layout/)).toBeInTheDocument();
  });

  it('shows "Start reconciliation" button for LOCKED plan', () => {
    const plan = makePlan({
      state: 'LOCKED',
      lockedAt: '2026-04-21T10:00:00Z',
      commits: [makeCommit()],
    });
    mockUseGetCurrentPlanQuery.mockReturnValue({ data: plan, isLoading: false });

    render(<ReconciliationPage />);

    expect(screen.getByText('Ready to reconcile')).toBeInTheDocument();
    expect(screen.getByText('Start reconciliation')).toBeInTheDocument();
  });

  it('shows reconciled state message for RECONCILED plan', () => {
    const plan = makePlan({
      state: 'RECONCILED',
      reconciledAt: '2026-04-25T17:00:00Z',
      lockedAt: '2026-04-21T10:00:00Z',
    });
    mockUseGetCurrentPlanQuery.mockReturnValue({ data: plan, isLoading: false });

    render(<ReconciliationPage />);

    expect(screen.getAllByText('Reconciled').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/This week is closed/)).toBeInTheDocument();
  });

  it('shows empty state when no plan exists', () => {
    mockUseGetCurrentPlanQuery.mockReturnValue({ data: undefined, isLoading: false });

    render(<ReconciliationPage />);

    expect(screen.getByText('No plan to reconcile')).toBeInTheDocument();
  });
});
