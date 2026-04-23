import type { CarryDecision, CommitStatus } from './enums';

export interface CommitReconciliation {
  id: string;
  commitId: string;
  status: CommitStatus;
  actualOutcome: string | null;
  deltaReason: string | null;
  carryDecision: CarryDecision | null;
  carryRationale: string | null;
  nextCommitId: string | null;
  reconciledAt: string;
}

export interface ReconcileCommitInput {
  commitId: string;
  status: CommitStatus;
  actualOutcome?: string;
  deltaReason?: string;
  carryDecision?: CarryDecision;
  carryRationale?: string;
}

export interface ReconcilePlanRequest {
  reconciliations: ReconcileCommitInput[];
}
