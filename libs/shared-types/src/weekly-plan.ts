import type { PlanState } from './enums';
import type { WeeklyCommit } from './weekly-commit';
import type { ManagerReview } from './manager-review';

export interface WeeklyPlan {
  id: string;
  userId: string;
  userDisplayName: string;
  weekStartDate: string;
  state: PlanState;
  draftedAt: string;
  lockedAt: string | null;
  reconciliationStartedAt: string | null;
  reconciledAt: string | null;
  reviewedAt: string | null;
  version: number;
  commits: WeeklyCommit[];
  review: ManagerReview | null;
}

export interface CreatePlanRequest {
  weekStartDate: string;
}

export interface LockValidationError {
  commitId: string;
  field: 'supportingOutcome' | 'chessLayer' | 'priority' | 'expectedEvidence' | 'rationale';
  message: string;
}

export interface LockValidationResult {
  canLock: boolean;
  errors: LockValidationError[];
}
