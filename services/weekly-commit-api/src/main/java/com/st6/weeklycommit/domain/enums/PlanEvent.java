package com.st6.weeklycommit.domain.enums;

/** State machine events for {@link PlanState} transitions. */
public enum PlanEvent {
  LOCK,
  START_RECONCILIATION,
  RECONCILE
}
