package com.st6.weeklycommit.domain.enums;

/**
 * Weekly plan lifecycle. Carry Forward is intentionally NOT a state; it is an
 * action invoked during/after RECONCILING that creates child commits in the
 * next week's DRAFT plan. See CLAUDE.md for the rationale.
 */
public enum PlanState {
  DRAFT,
  LOCKED,
  RECONCILING,
  RECONCILED
}
