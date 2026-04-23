import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { TeamWeekRollup, ExceptionCard } from '@st6/shared-types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockUseGetTeamExceptionsQuery = vi.fn();
const mockUseGetRollupHistoryQuery = vi.fn();

vi.mock('@st6/api-client', () => ({
  useGetTeamExceptionsQuery: (...args: unknown[]) => mockUseGetTeamExceptionsQuery(...args),
  useGetRollupHistoryQuery: (...args: unknown[]) => mockUseGetRollupHistoryQuery(...args),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// ---------------------------------------------------------------------------
// Import the component under test AFTER mocks
// ---------------------------------------------------------------------------
import { ManagerQueuePage } from '../ManagerQueuePage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRollup(overrides: Partial<TeamWeekRollup> = {}): TeamWeekRollup {
  return {
    teamId: '00000000-0000-0000-0000-000000000010',
    weekStartDate: '2026-04-20',
    totalReports: 6,
    alignmentPercent: 92,
    planningCompletionPercent: 100,
    reconciliationAccuracyPercent: 83,
    reviewSlaMetPercent: 95,
    carryForwardRate: 12,
    timeToPlanMedianMinutes: 18,
    outcomeCoverageCount: 5,
    ...overrides,
  };
}

function makeException(overrides: Partial<ExceptionCard> & { type: ExceptionCard['type'] }): ExceptionCard {
  const base = {
    id: 'exc-1',
    detectedAt: '2026-04-22T08:00:00Z',
    severity: 'warning' as const,
    reportUserId: 'user-2',
    reportUserDisplayName: 'Alice',
  };

  switch (overrides.type) {
    case 'OVERDUE_LOCK':
      return {
        ...base,
        type: 'OVERDUE_LOCK',
        weekStartDate: '2026-04-20',
        hoursOverdue: 14,
        ...overrides,
      } as ExceptionCard;
    case 'REPEATED_CARRY_FORWARD':
      return {
        ...base,
        type: 'REPEATED_CARRY_FORWARD',
        commitId: 'c-1',
        commitTitle: 'Fix performance regression',
        carryGeneration: 3,
        rootCommitId: 'c-root',
        ...overrides,
      } as ExceptionCard;
    case 'OUTCOME_COVERAGE_GAP':
      return {
        ...base,
        type: 'OUTCOME_COVERAGE_GAP',
        outcomeId: 'o-1',
        outcomeTitle: 'Improve onboarding flow',
        weeksUncovered: 3,
        ...overrides,
      } as ExceptionCard;
    default:
      return {
        ...base,
        ...overrides,
      } as ExceptionCard;
  }
}

beforeEach(() => {
  vi.clearAllMocks();

  mockUseGetTeamExceptionsQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: undefined,
  });
  mockUseGetRollupHistoryQuery.mockReturnValue({ data: undefined });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ManagerQueuePage', () => {
  it('renders loading spinner while data is loading', () => {
    mockUseGetTeamExceptionsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { container } = render(<ManagerQueuePage />);

    const spinner = container.querySelector('.animate-spin') ?? screen.queryByRole('status');
    expect(spinner).toBeTruthy();
  });

  it('renders exception cards', () => {
    const exceptions: ExceptionCard[] = [
      makeException({ id: 'e1', type: 'OVERDUE_LOCK' }),
      makeException({
        id: 'e2',
        type: 'REPEATED_CARRY_FORWARD',
        commitTitle: 'Fix performance regression',
        carryGeneration: 3,
      }),
    ];

    mockUseGetTeamExceptionsQuery.mockReturnValue({
      data: {
        rollup: makeRollup(),
        exceptions: {
          content: exceptions,
          totalElements: exceptions.length,
          totalPages: 1,
          number: 0,
          size: 50,
        },
      },
      isLoading: false,
      error: undefined,
    });

    render(<ManagerQueuePage />);

    // Overdue lock card title
    expect(screen.getByText("Alice hasn't locked the week")).toBeInTheDocument();
    // Repeated carry forward card title
    expect(
      screen.getByText('"Fix performance regression" \u2014 carry generation 3'),
    ).toBeInTheDocument();
    // Dynamic header based on exception count
    expect(screen.getByText('2 things need you')).toBeInTheDocument();
  });

  it('renders rollup metrics', () => {
    const rollup = makeRollup({
      alignmentPercent: 92,
      planningCompletionPercent: 100,
      reconciliationAccuracyPercent: 83,
      reviewSlaMetPercent: 95,
      carryForwardRate: 12,
      totalReports: 6,
      outcomeCoverageCount: 5,
    });

    mockUseGetTeamExceptionsQuery.mockReturnValue({
      data: {
        rollup,
        exceptions: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 },
      },
      isLoading: false,
      error: undefined,
    });

    render(<ManagerQueuePage />);

    // RollupBar renders metric labels
    expect(screen.getByText('Aligned')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Review SLA')).toBeInTheDocument();
    expect(screen.getByText('Carry-fwd')).toBeInTheDocument();
    expect(screen.getByText('Time-to-plan')).toBeInTheDocument();

    // Metric values
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('18m')).toBeInTheDocument();
  });

  it('shows "all clear" when no exceptions exist', () => {
    mockUseGetTeamExceptionsQuery.mockReturnValue({
      data: {
        rollup: makeRollup(),
        exceptions: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 },
      },
      isLoading: false,
      error: undefined,
    });

    render(<ManagerQueuePage />);

    expect(screen.getByText("You're caught up.")).toBeInTheDocument();
  });

  it('shows error state when API fails', () => {
    mockUseGetTeamExceptionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
    });

    render(<ManagerQueuePage />);

    expect(screen.getByText("Couldn't load the team queue")).toBeInTheDocument();
  });
});
