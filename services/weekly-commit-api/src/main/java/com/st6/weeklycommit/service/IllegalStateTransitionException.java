package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.enums.PlanEvent;
import com.st6.weeklycommit.domain.enums.PlanState;

/** Caller tried to fire an event that's not legal from the current state. */
public class IllegalStateTransitionException extends RuntimeException {
  public IllegalStateTransitionException(PlanState from, PlanEvent event) {
    super("Cannot fire " + event + " from state " + from);
  }
}
