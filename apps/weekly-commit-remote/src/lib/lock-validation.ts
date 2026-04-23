import type { WeeklyCommit, WeeklyPlan } from '@st6/shared-types';

/**
 * Mirror of the backend lock guard so the client can disable the Lock button
 * with field-level hints BEFORE round-tripping. Backend is still the source of
 * truth (returns 422 with structured errors) — this is purely UX.
 */
export interface CommitFieldErrors {
  supportingOutcome?: string;
  chessLayer?: string;
  priority?: string;
  expectedEvidence?: string;
}

export interface LockReadiness {
  canLock: boolean;
  emptyPlan: boolean;
  errorsByCommit: Record<string, CommitFieldErrors>;
  totalIssues: number;
}

export function evaluateLockReadiness(plan: WeeklyPlan): LockReadiness {
  const active = plan.commits.filter((c) => c.active);
  const errorsByCommit: Record<string, CommitFieldErrors> = {};
  let total = 0;

  for (const c of active) {
    const errors = checkCommit(c);
    if (Object.keys(errors).length > 0) {
      errorsByCommit[c.id] = errors;
      total += Object.keys(errors).length;
    }
  }
  return {
    canLock: active.length > 0 && total === 0,
    emptyPlan: active.length === 0,
    errorsByCommit,
    totalIssues: total,
  };
}

function checkCommit(c: WeeklyCommit): CommitFieldErrors {
  const e: CommitFieldErrors = {};
  if (!c.supportingOutcomeId) e.supportingOutcome = 'Pick a Supporting Outcome.';
  if (!c.chessLayerCategoryId) e.chessLayer = 'Pick a chess layer.';
  if (c.priorityRank < 1) e.priority = 'Set a priority.';
  if (!c.expectedEvidence?.trim()) e.expectedEvidence = 'Describe how you’ll know it’s done.';
  return e;
}
