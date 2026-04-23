import { describe, expect, it } from 'vitest';
import type { WeeklyPlan, WeeklyCommit } from '@st6/shared-types';
import { evaluateLockReadiness } from './lock-validation';

function commit(overrides: Partial<WeeklyCommit> = {}): WeeklyCommit {
  return {
    id: overrides.id ?? 'c1',
    planId: 'p1',
    title: 'Test',
    rationale: null,
    expectedEvidence: 'evidence here',
    supportingOutcomeId: 'so1',
    chessLayerCategoryId: 'ch1',
    priorityRank: 1,
    lockedOutcomePath: null,
    lockedOutcomeTitles: null,
    sourceCommitId: null,
    carryGeneration: 1,
    requiresManagerAck: false,
    active: true,
    reconciliation: null,
    version: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function plan(commits: WeeklyCommit[]): WeeklyPlan {
  return {
    id: 'p1',
    userId: 'u1',
    userDisplayName: 'Test',
    weekStartDate: '2026-04-20',
    state: 'DRAFT',
    draftedAt: '2026-04-20T00:00:00Z',
    lockedAt: null,
    reconciliationStartedAt: null,
    reconciledAt: null,
    reviewedAt: null,
    version: 0,
    commits,
    review: null,
  };
}

describe('evaluateLockReadiness', () => {
  it('flags an empty plan', () => {
    const r = evaluateLockReadiness(plan([]));
    expect(r.canLock).toBe(false);
    expect(r.emptyPlan).toBe(true);
  });

  it('flags a missing supporting outcome with field error', () => {
    const r = evaluateLockReadiness(plan([commit({ supportingOutcomeId: null })]));
    expect(r.canLock).toBe(false);
    expect(r.errorsByCommit['c1']?.supportingOutcome).toMatch(/Supporting Outcome/);
  });

  it('flags a missing chess layer', () => {
    const r = evaluateLockReadiness(plan([commit({ chessLayerCategoryId: null })]));
    expect(r.errorsByCommit['c1']?.chessLayer).toBeDefined();
  });

  it('flags missing expected evidence', () => {
    const r = evaluateLockReadiness(plan([commit({ expectedEvidence: '   ' })]));
    expect(r.errorsByCommit['c1']?.expectedEvidence).toBeDefined();
  });

  it('passes when every commit is fully aligned', () => {
    const r = evaluateLockReadiness(plan([commit({ id: 'a' }), commit({ id: 'b' })]));
    expect(r.canLock).toBe(true);
    expect(r.totalIssues).toBe(0);
  });

  it('ignores soft-deleted (inactive) commits', () => {
    const r = evaluateLockReadiness(
      plan([commit({ id: 'a' }), commit({ id: 'b', active: false, supportingOutcomeId: null })]),
    );
    expect(r.canLock).toBe(true);
  });
});
