import type { CommitReconciliation } from './reconciliation';

export interface WeeklyCommit {
  id: string;
  planId: string;
  title: string;
  rationale: string | null;
  expectedEvidence: string | null;
  supportingOutcomeId: string | null;
  chessLayerCategoryId: string | null;
  priorityRank: number;
  /**
   * Snapshot path string (RC › DO › O › SO) captured at lock time, not derived live.
   * Survives RCDO renames/restructures for historical reporting.
   */
  lockedOutcomePath: string | null;
  lockedOutcomeTitles: Record<string, string> | null;
  /**
   * Provenance — source commit for carry-forward children.
   */
  sourceCommitId: string | null;
  carryGeneration: number;
  requiresManagerAck: boolean;
  active: boolean;
  reconciliation: CommitReconciliation | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommitRequest {
  title: string;
  rationale?: string;
  expectedEvidence?: string;
  supportingOutcomeId?: string;
  chessLayerCategoryId?: string;
  priorityRank?: number;
}

export interface UpdateCommitRequest extends CreateCommitRequest {
  version: number;
}
