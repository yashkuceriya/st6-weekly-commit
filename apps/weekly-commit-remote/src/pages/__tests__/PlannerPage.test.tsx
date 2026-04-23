import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { WeeklyPlan, WeeklyCommit, ChessLayerCategory } from '@st6/shared-types';

// ---------------------------------------------------------------------------
// Mocks — RTK Query hooks from @st6/api-client
// ---------------------------------------------------------------------------
const mockUseGetCurrentPlanQuery = vi.fn();
const mockUseGetChessLayersQuery = vi.fn();
const mockUseGetStrategicTreeQuery = vi.fn();
const mockUseGetPlanActivityQuery = vi.fn();
const mockUseAddCommitMutation = vi.fn();
const mockUseUpdateCommitMutation = vi.fn();
const mockUseDeleteCommitMutation = vi.fn();
const mockUseLockPlanMutation = vi.fn();
const mockUseCreatePlanMutation = vi.fn();
const mockUseGetPlanHistoryQuery = vi.fn();

vi.mock('@st6/api-client', () => ({
  useGetCurrentPlanQuery: (...args: unknown[]) => mockUseGetCurrentPlanQuery(...args),
  useGetChessLayersQuery: (...args: unknown[]) => mockUseGetChessLayersQuery(...args),
  useGetStrategicTreeQuery: (...args: unknown[]) => mockUseGetStrategicTreeQuery(...args),
  useGetPlanActivityQuery: (...args: unknown[]) => mockUseGetPlanActivityQuery(...args),
  useGetPlanHistoryQuery: (...args: unknown[]) => mockUseGetPlanHistoryQuery(...args),
  useAddCommitMutation: (...args: unknown[]) => mockUseAddCommitMutation(...args),
  useUpdateCommitMutation: (...args: unknown[]) => mockUseUpdateCommitMutation(...args),
  useDeleteCommitMutation: (...args: unknown[]) => mockUseDeleteCommitMutation(...args),
  useLockPlanMutation: (...args: unknown[]) => mockUseLockPlanMutation(...args),
  useCreatePlanMutation: (...args: unknown[]) => mockUseCreatePlanMutation(...args),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// ---------------------------------------------------------------------------
// Import the component under test AFTER mocks are declared
// ---------------------------------------------------------------------------
import { PlannerPage } from '../PlannerPage';

// ---------------------------------------------------------------------------
// Helpers — build fixture data
// ---------------------------------------------------------------------------
function makeCommit(overrides: Partial<WeeklyCommit> = {}): WeeklyCommit {
  return {
    id: 'commit-1',
    planId: 'plan-1',
    title: 'Ship login flow',
    rationale: null,
    expectedEvidence: 'Login e2e test passes',
    supportingOutcomeId: 'so-1',
    chessLayerCategoryId: 'cl-1',
    priorityRank: 1,
    lockedOutcomePath: null,
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

const chessLayers: ChessLayerCategory[] = [
  {
    id: 'cl-1',
    name: 'Offense',
    description: null,
    color: '#E07A5F',
    displayOrder: 1,
    weight: 1,
    isDefault: true,
    active: true,
  },
];

// Stub that all mutation hooks return
const mutationTuple = [vi.fn(), { isLoading: false }] as const;

// ---------------------------------------------------------------------------
// Default hook return values (overridden per-test as needed)
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();

  // Default: loading finished, no data
  mockUseGetCurrentPlanQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined });
  mockUseGetChessLayersQuery.mockReturnValue({ data: chessLayers });
  mockUseGetStrategicTreeQuery.mockReturnValue({ data: [] });
  mockUseGetPlanActivityQuery.mockReturnValue({ data: [] });
  mockUseGetPlanHistoryQuery.mockReturnValue({ data: [] });
  mockUseAddCommitMutation.mockReturnValue([vi.fn()]);
  mockUseUpdateCommitMutation.mockReturnValue([vi.fn()]);
  mockUseDeleteCommitMutation.mockReturnValue([vi.fn()]);
  mockUseLockPlanMutation.mockReturnValue(mutationTuple);
  mockUseCreatePlanMutation.mockReturnValue([vi.fn()]);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PlannerPage', () => {
  it('renders loading spinner when data is loading', () => {
    mockUseGetCurrentPlanQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { container } = render(<PlannerPage />);
    // The Spinner component renders a role="status" element
    const spinner = container.querySelector('.animate-spin') ?? screen.queryByRole('status');
    expect(spinner).toBeTruthy();
  });

  it('renders commit cards when plan data loads', () => {
    const plan = makePlan({
      commits: [
        makeCommit({ id: 'c1', title: 'Ship login flow' }),
        makeCommit({ id: 'c2', title: 'Fix dashboard layout' }),
      ],
    });

    mockUseGetCurrentPlanQuery.mockReturnValue({
      data: plan,
      isLoading: false,
      error: undefined,
    });

    render(<PlannerPage />);

    expect(screen.getByText('Ship login flow')).toBeInTheDocument();
    expect(screen.getByText('Fix dashboard layout')).toBeInTheDocument();
  });

  it('shows validation errors for incomplete commits', () => {
    // A commit missing supportingOutcomeId, chessLayerCategoryId, and expectedEvidence
    const incompleteCommit = makeCommit({
      id: 'c-incomplete',
      title: 'Incomplete work item',
      supportingOutcomeId: null,
      chessLayerCategoryId: null,
      expectedEvidence: null,
    });
    const plan = makePlan({ commits: [incompleteCommit] });

    mockUseGetCurrentPlanQuery.mockReturnValue({
      data: plan,
      isLoading: false,
      error: undefined,
    });

    render(<PlannerPage />);

    // The lock-validation module produces field-level error messages
    expect(screen.getByText('Pick a Supporting Outcome.')).toBeInTheDocument();
    expect(screen.getByText('Pick a chess layer.')).toBeInTheDocument();
    expect(screen.getByText(/Describe how you.ll know it.s done/)).toBeInTheDocument();
  });

  it('shows "Add commit" button in DRAFT state', () => {
    const plan = makePlan({
      state: 'DRAFT',
      commits: [makeCommit()],
    });

    mockUseGetCurrentPlanQuery.mockReturnValue({
      data: plan,
      isLoading: false,
      error: undefined,
    });

    render(<PlannerPage />);

    expect(screen.getByText(/Add commit/)).toBeInTheDocument();
  });

  it('does not show "Add commit" button in LOCKED state', () => {
    const plan = makePlan({
      state: 'LOCKED',
      lockedAt: '2026-04-21T10:00:00Z',
      commits: [makeCommit()],
    });

    mockUseGetCurrentPlanQuery.mockReturnValue({
      data: plan,
      isLoading: false,
      error: undefined,
    });

    render(<PlannerPage />);

    expect(screen.queryByText(/Add commit/)).not.toBeInTheDocument();
  });

  it('shows empty state when plan has no commits', () => {
    const plan = makePlan({ state: 'DRAFT', commits: [] });

    mockUseGetCurrentPlanQuery.mockReturnValue({
      data: plan,
      isLoading: false,
      error: undefined,
    });

    render(<PlannerPage />);

    expect(screen.getByText('First week on Weekly Commit?')).toBeInTheDocument();
  });

  it('shows error state when API returns an error', () => {
    mockUseGetCurrentPlanQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
    });

    render(<PlannerPage />);

    expect(screen.getByText("Couldn't load your plan")).toBeInTheDocument();
  });
});
