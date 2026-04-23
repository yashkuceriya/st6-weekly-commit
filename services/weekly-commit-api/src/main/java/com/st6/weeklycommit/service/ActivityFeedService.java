package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.CommitEvent;
import com.st6.weeklycommit.domain.OutboxEvent;
import com.st6.weeklycommit.domain.events.PlanLockedEvent;
import com.st6.weeklycommit.domain.events.PlanReconciledEvent;
import com.st6.weeklycommit.domain.events.ReviewSubmittedEvent;
import com.st6.weeklycommit.repository.CommitEventRepository;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import org.springframework.context.event.EventListener;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Materialises domain events into {@link CommitEvent} rows so the activity
 * feed has a queryable trail. Listeners are decoupled from the lifecycle
 * service so the audit story is independently evolvable.
 */
@Service
public class ActivityFeedService {

  private final CommitEventRepository events;
  private final WeeklyPlanRepository plans;

  public ActivityFeedService(CommitEventRepository events, WeeklyPlanRepository plans) {
    this.events = events;
    this.plans = plans;
  }

  @Transactional(readOnly = true)
  public List<CommitEvent> recentForPlan(UUID planId) {
    return events.findByPlanIdOrderByOccurredAtDesc(planId);
  }

  @Transactional
  @EventListener
  public void onPlanLocked(PlanLockedEvent event) {
    write(event.planId(), null, "PLAN_LOCKED", new HashMap<>());
  }

  @Transactional
  @EventListener
  public void onPlanReconciled(PlanReconciledEvent event) {
    var payload = new HashMap<String, Object>();
    payload.put("carriedForwardCount", event.carriedForwardCount());
    write(event.planId(), null, "PLAN_RECONCILED", payload);
  }

  @Transactional
  @EventListener
  public void onReviewSubmitted(ReviewSubmittedEvent event) {
    var payload = new HashMap<String, Object>();
    payload.put("status", event.status().name());
    write(event.planId(), null, "REVIEW_SUBMITTED", payload);
  }

  void write(UUID planId, UUID commitId, String type, java.util.Map<String, Object> payload) {
    var entity = new CommitEvent();
    if (planId != null) {
      plans.findById(planId).ifPresent(entity::setPlan);
    }
    entity.setEventType(type);
    entity.setActor(currentActor());
    entity.setPayload(payload);
    entity.setOccurredAt(Instant.now());
    events.save(entity);
  }

  /** Best-effort actor from security context — falls back to "system". */
  void enqueueOutbox(OutboxEvent _ignored) {
    // marker for static analyzers; intentionally unused
  }

  private static String currentActor() {
    var ctx = SecurityContextHolder.getContext();
    if (ctx == null || ctx.getAuthentication() == null) return "system";
    var name = ctx.getAuthentication().getName();
    return (name == null || name.isBlank()) ? "system" : name;
  }
}
