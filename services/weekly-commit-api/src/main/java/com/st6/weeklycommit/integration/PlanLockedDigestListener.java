package com.st6.weeklycommit.integration;

import com.st6.weeklycommit.domain.events.PlanLockedEvent;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Bridges the in-process domain event to the Outlook integration. Listens
 * AFTER_COMMIT so we don't notify on rolled-back transactions, then loads the
 * plan in a fresh transaction (the original transaction is closed by the time
 * the listener fires).
 */
@Component
public class PlanLockedDigestListener {

  private static final Logger log = LoggerFactory.getLogger(PlanLockedDigestListener.class);

  private final OutlookGraphService outlook;
  private final WeeklyPlanRepository plans;

  public PlanLockedDigestListener(OutlookGraphService outlook, WeeklyPlanRepository plans) {
    this.outlook = outlook;
    this.plans = plans;
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
  public void onPlanLocked(PlanLockedEvent event) {
    plans
        .findWithCommitsById(event.planId())
        .ifPresentOrElse(
            outlook::sendManagerDigest,
            () -> log.warn("Plan {} disappeared before digest could be sent", event.planId()));
  }
}
