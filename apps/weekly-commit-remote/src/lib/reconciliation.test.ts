import { describe, expect, it } from 'vitest';
import {
  emptyDraft,
  isReconciliationComplete,
  rationaleStrengthForCarry,
} from './reconciliation';

describe('rationaleStrengthForCarry', () => {
  it('accepts any non-empty rationale at gen 1', () => {
    expect(rationaleStrengthForCarry(1, 'short').ok).toBe(true);
    expect(rationaleStrengthForCarry(1, '').ok).toBe(false);
  });

  it('requires ≥ 60 chars at gen 2', () => {
    expect(rationaleStrengthForCarry(2, 'still too short').ok).toBe(false);
    expect(rationaleStrengthForCarry(2, 'x'.repeat(60)).ok).toBe(true);
  });

  it('requires ≥ 60 chars at gen 3 too — backend manager-ack is the gate beyond text', () => {
    expect(rationaleStrengthForCarry(3, 'x'.repeat(60)).ok).toBe(true);
  });

  it('reports the deficit length in the message at gen 2+', () => {
    const r = rationaleStrengthForCarry(2, 'twelve chars');
    expect(r.message).toMatch(/12/);
  });
});

describe('isReconciliationComplete', () => {
  it('Delivered passes with just the disposition', () => {
    const draft = { ...emptyDraft('c1'), status: 'DELIVERED' as const };
    expect(isReconciliationComplete(draft, 1)).toBe(true);
  });

  it('Partial requires actual + delta + decision', () => {
    const draft = {
      ...emptyDraft('c1'),
      status: 'PARTIAL' as const,
      actualOutcome: 'half',
      deltaReason: 'reason',
      carryDecision: 'DROP' as const,
    };
    expect(isReconciliationComplete(draft, 1)).toBe(true);
  });

  it('Carry-forward at gen 2+ enforces longer rationale', () => {
    const draft = {
      ...emptyDraft('c1'),
      status: 'MISSED' as const,
      actualOutcome: 'nope',
      deltaReason: 'reason',
      carryDecision: 'CARRY_FORWARD' as const,
      carryRationale: 'too short',
    };
    expect(isReconciliationComplete(draft, 2)).toBe(false);
  });
});
