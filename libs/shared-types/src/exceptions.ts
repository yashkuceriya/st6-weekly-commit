import type { ExceptionType } from './enums';

interface BaseExceptionCard {
  id: string;
  type: ExceptionType;
  detectedAt: string;
  severity: 'info' | 'warning' | 'critical';
  reportUserId: string;
  reportUserDisplayName: string;
}

export interface OverdueLockException extends BaseExceptionCard {
  type: typeof ExceptionType.OVERDUE_LOCK;
  weekStartDate: string;
  hoursOverdue: number;
}

export interface PendingReviewSlaException extends BaseExceptionCard {
  type: typeof ExceptionType.PENDING_REVIEW_SLA;
  planId: string;
  weekStartDate: string;
  hoursPending: number;
}

export interface RepeatedCarryForwardException extends BaseExceptionCard {
  type: typeof ExceptionType.REPEATED_CARRY_FORWARD;
  commitId: string;
  commitTitle: string;
  carryGeneration: number;
  rootCommitId: string;
}

export interface OutcomeCoverageGapException extends BaseExceptionCard {
  type: typeof ExceptionType.OUTCOME_COVERAGE_GAP;
  outcomeId: string;
  outcomeTitle: string;
  weeksUncovered: number;
}

export interface BlockedHighPriorityException extends BaseExceptionCard {
  type: typeof ExceptionType.BLOCKED_HIGH_PRIORITY;
  commitId: string;
  commitTitle: string;
  priorityRank: number;
  deltaReason: string;
}

export type ExceptionCard =
  | OverdueLockException
  | PendingReviewSlaException
  | RepeatedCarryForwardException
  | OutcomeCoverageGapException
  | BlockedHighPriorityException;
