export const StrategicNodeType = {
  RALLY_CRY: 'RALLY_CRY',
  DEFINING_OBJECTIVE: 'DEFINING_OBJECTIVE',
  OUTCOME: 'OUTCOME',
  SUPPORTING_OUTCOME: 'SUPPORTING_OUTCOME',
} as const;
export type StrategicNodeType = (typeof StrategicNodeType)[keyof typeof StrategicNodeType];

export const PlanState = {
  DRAFT: 'DRAFT',
  LOCKED: 'LOCKED',
  RECONCILING: 'RECONCILING',
  RECONCILED: 'RECONCILED',
} as const;
export type PlanState = (typeof PlanState)[keyof typeof PlanState];

export const PlanEvent = {
  LOCK: 'LOCK',
  START_RECONCILIATION: 'START_RECONCILIATION',
  RECONCILE: 'RECONCILE',
} as const;
export type PlanEvent = (typeof PlanEvent)[keyof typeof PlanEvent];

export const CommitStatus = {
  DELIVERED: 'DELIVERED',
  PARTIAL: 'PARTIAL',
  MISSED: 'MISSED',
} as const;
export type CommitStatus = (typeof CommitStatus)[keyof typeof CommitStatus];

export const CarryDecision = {
  DROP: 'DROP',
  FINISHED_NEXT_WEEK: 'FINISHED_NEXT_WEEK',
  CARRY_FORWARD: 'CARRY_FORWARD',
} as const;
export type CarryDecision = (typeof CarryDecision)[keyof typeof CarryDecision];

export const ManagerReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  NEEDS_DISCUSSION: 'NEEDS_DISCUSSION',
} as const;
export type ManagerReviewStatus =
  (typeof ManagerReviewStatus)[keyof typeof ManagerReviewStatus];

export const ExceptionType = {
  OVERDUE_LOCK: 'OVERDUE_LOCK',
  PENDING_REVIEW_SLA: 'PENDING_REVIEW_SLA',
  REPEATED_CARRY_FORWARD: 'REPEATED_CARRY_FORWARD',
  OUTCOME_COVERAGE_GAP: 'OUTCOME_COVERAGE_GAP',
  BLOCKED_HIGH_PRIORITY: 'BLOCKED_HIGH_PRIORITY',
} as const;
export type ExceptionType = (typeof ExceptionType)[keyof typeof ExceptionType];
