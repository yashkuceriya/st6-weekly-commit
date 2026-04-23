package com.st6.weeklycommit.domain.enums;

public enum CarryDecision {
  /** Drop the work entirely; no follow-up. */
  DROP,
  /** Will be picked up next week as a fresh commit, no provenance link. */
  FINISHED_NEXT_WEEK,
  /** System creates a child commit in next week's DRAFT with provenance back. */
  CARRY_FORWARD
}
