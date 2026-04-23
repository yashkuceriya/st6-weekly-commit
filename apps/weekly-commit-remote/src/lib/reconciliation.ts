import { CommitStatus, type CommitStatus as CommitStatusType, type CarryDecision } from '@st6/shared-types';

export interface ReconciliationDraft {
  commitId: string;
  status: CommitStatusType | null;
  actualOutcome: string | null;
  deltaReason: string | null;
  carryDecision: CarryDecision | null;
  carryRationale: string | null;
}

export function emptyDraft(commitId: string): ReconciliationDraft {
  return {
    commitId,
    status: null,
    actualOutcome: null,
    deltaReason: null,
    carryDecision: null,
    carryRationale: null,
  };
}

/** Mirrors the backend escalation rule from PlanGuards. */
export function rationaleStrengthForCarry(
  nextGeneration: number,
  text: string,
): { ok: boolean; message: string } {
  const trimmed = text?.trim() ?? '';
  if (nextGeneration < 2) {
    return {
      ok: trimmed.length > 0,
      message: trimmed.length > 0 ? 'Looks good.' : 'A short rationale is required.',
    };
  }
  // Gen 2+ requires longer rationale (>= 60 chars, matches backend).
  if (trimmed.length < 60) {
    return {
      ok: false,
      message: `Need ≥ 60 chars (have ${trimmed.length}). This is the ${ordinal(nextGeneration)} carry — explain what's still keeping it open.`,
    };
  }
  return { ok: true, message: `Strong enough (${trimmed.length} chars).` };
}

export function isReconciliationComplete(draft: ReconciliationDraft, nextGeneration: number): boolean {
  if (!draft.status) return false;
  if (draft.status === CommitStatus.DELIVERED) return true;
  if (!draft.actualOutcome?.trim() || !draft.deltaReason?.trim()) return false;
  if (!draft.carryDecision) return false;
  if (draft.carryDecision === 'CARRY_FORWARD') {
    return rationaleStrengthForCarry(nextGeneration, draft.carryRationale ?? '').ok;
  }
  return true;
}

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}
