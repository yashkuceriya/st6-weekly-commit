package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.AppUser;
import com.st6.weeklycommit.domain.CommitReconciliation;
import com.st6.weeklycommit.domain.OutboxEvent;
import com.st6.weeklycommit.domain.WeeklyCommit;
import com.st6.weeklycommit.domain.WeeklyPlan;
import com.st6.weeklycommit.domain.enums.CarryDecision;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import com.st6.weeklycommit.domain.enums.PlanEvent;
import com.st6.weeklycommit.domain.enums.PlanState;
import com.st6.weeklycommit.domain.events.PlanLockedEvent;
import com.st6.weeklycommit.domain.events.PlanReconciledEvent;
import com.st6.weeklycommit.repository.OutboxEventRepository;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The state machine + lifecycle orchestrator for {@link WeeklyPlan}.
 *
 * <p>I deliberately did NOT use the Spring State Machine framework here. The
 * library shines for diagrams of complex workflows with deep guard hierarchies;
 * this lifecycle is small enough that explicit transitions read more clearly,
 * tests are trivial, and there's no reactive-API ceremony. The guard logic
 * (alignment validation, lock-time snapshot, carry escalation) is the
 * interesting part — the framework would mostly be in the way.
 *
 * <p>Each transition method:
 *
 * <ol>
 *   <li>verifies the source state is legal,
 *   <li>runs the guard (delegates to {@link PlanGuards}),
 *   <li>mutates state + timestamps,
 *   <li>writes a transactional outbox event so async consumers can react,
 *   <li>publishes a Spring application event for in-process listeners.
 * </ol>
 *
 * <p>All public methods are {@code @Transactional} so the outbox write is in
 * the same transaction as the state change — at-least-once delivery, no
 * cross-process race.
 */
@Service
public class PlanLifecycleService {

  private static final Logger log = LoggerFactory.getLogger(PlanLifecycleService.class);

  private final WeeklyPlanRepository plans;
  private final OutboxEventRepository outbox;
  private final ApplicationEventPublisher publisher;
  private final StrategicPathResolver paths;
  private final PlanGuards guards;
  private final CarryForwardService carryForward;

  public PlanLifecycleService(
      WeeklyPlanRepository plans,
      OutboxEventRepository outbox,
      ApplicationEventPublisher publisher,
      StrategicPathResolver paths,
      PlanGuards guards,
      CarryForwardService carryForward) {
    this.plans = plans;
    this.outbox = outbox;
    this.publisher = publisher;
    this.paths = paths;
    this.guards = guards;
    this.carryForward = carryForward;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Plan creation
  // ────────────────────────────────────────────────────────────────────────

  @Transactional
  public WeeklyPlan createPlanForCurrentWeek(AppUser user) {
    return createPlan(user, currentWeekStart());
  }

  @Transactional
  public WeeklyPlan createPlan(AppUser user, LocalDate weekStart) {
    if (weekStart.getDayOfWeek() != DayOfWeek.MONDAY) {
      throw new IllegalArgumentException("Week start must be a Monday, got " + weekStart);
    }
    return plans
        .findActiveByUserAndWeek(user.getId(), weekStart)
        .orElseGet(
            () -> {
              var plan = new WeeklyPlan();
              plan.setUser(user);
              plan.setWeekStartDate(weekStart);
              plan.setState(PlanState.DRAFT);
              plan.setDraftedAt(Instant.now());
              return plans.save(plan);
            });
  }

  // ────────────────────────────────────────────────────────────────────────
  // State transitions
  // ────────────────────────────────────────────────────────────────────────

  @Transactional
  public WeeklyPlan lock(UUID planId) {
    var plan = require(planId);
    requireState(plan, PlanState.DRAFT, PlanEvent.LOCK);
    guards.guardLock(plan);

    var now = Instant.now();
    plan.setState(PlanState.LOCKED);
    plan.setLockedAt(now);

    snapshotOutcomesAtLock(plan);

    enqueueOutbox("WeeklyPlan", plan.getId(), "PLAN_LOCKED", Map.of(
        "userId", plan.getUser().getId().toString(),
        "weekStartDate", plan.getWeekStartDate().toString(),
        "commitCount", plan.activeCommits().size()
    ));
    publisher.publishEvent(new PlanLockedEvent(plan.getId(), plan.getUser().getId(), now));
    log.info("Plan {} locked at {}", plan.getId(), now);
    return plan;
  }

  @Transactional
  public WeeklyPlan startReconciliation(UUID planId) {
    var plan = require(planId);
    requireState(plan, PlanState.LOCKED, PlanEvent.START_RECONCILIATION);
    plan.setState(PlanState.RECONCILING);
    plan.setReconciliationStartedAt(Instant.now());
    return plan;
  }

  @Transactional
  public WeeklyPlan reconcile(UUID planId, List<ReconcileInput> inputs) {
    var plan = require(planId);
    requireState(plan, PlanState.RECONCILING, PlanEvent.RECONCILE);
    guards.guardReconcile(plan, inputs);

    var byCommit = new HashMap<UUID, ReconcileInput>();
    for (var input : inputs) byCommit.put(input.commitId(), input);

    int carried = 0;
    for (var commit : plan.activeCommits()) {
      var input = byCommit.get(commit.getId());
      if (input == null) {
        continue; // guarded above; defensive
      }
      var rec = applyReconciliation(commit, input);
      if (rec.getCarryDecision() == CarryDecision.CARRY_FORWARD) {
        carryForward.materialize(commit, rec);
        carried++;
      }
    }

    var now = Instant.now();
    plan.setState(PlanState.RECONCILED);
    plan.setReconciledAt(now);

    enqueueOutbox("WeeklyPlan", plan.getId(), "PLAN_RECONCILED", Map.of(
        "userId", plan.getUser().getId().toString(),
        "weekStartDate", plan.getWeekStartDate().toString(),
        "carriedForwardCount", carried
    ));
    publisher.publishEvent(
        new PlanReconciledEvent(plan.getId(), plan.getUser().getId(), carried, now));
    log.info("Plan {} reconciled at {} ({} carried forward)", plan.getId(), now, carried);
    return plan;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────

  private WeeklyPlan require(UUID planId) {
    return plans
        .findWithCommitsById(planId)
        .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
  }

  private void requireState(WeeklyPlan plan, PlanState expected, PlanEvent event) {
    if (plan.getState() != expected) {
      throw new IllegalStateTransitionException(plan.getState(), event);
    }
  }

  private void snapshotOutcomesAtLock(WeeklyPlan plan) {
    for (var commit : plan.activeCommits()) {
      if (commit.getSupportingOutcome() == null) {
        continue; // guarded above; defensive
      }
      var resolved = paths.resolve(commit.getSupportingOutcome().getId());
      commit.setLockedOutcomePath(resolved.breadcrumb());
      commit.setLockedOutcomeTitles(resolved.titlesById());
    }
  }

  private CommitReconciliation applyReconciliation(WeeklyCommit commit, ReconcileInput input) {
    var rec = commit.getReconciliation();
    if (rec == null) {
      rec = new CommitReconciliation();
      rec.setCommit(commit);
      commit.setReconciliation(rec);
    }
    rec.setStatus(input.status());
    rec.setActualOutcome(input.actualOutcome());
    rec.setDeltaReason(input.deltaReason());
    rec.setCarryDecision(input.status() == CommitStatus.DELIVERED ? null : input.carryDecision());
    rec.setCarryRationale(input.carryRationale());
    rec.setReconciledAt(Instant.now());
    return rec;
  }

  private void enqueueOutbox(String aggregateType, UUID aggregateId, String eventType, Map<String, Object> payload) {
    var event = new OutboxEvent();
    event.setAggregateType(aggregateType);
    event.setAggregateId(aggregateId);
    event.setEventType(eventType);
    event.setPayload(new HashMap<>(payload));
    outbox.save(event);
  }

  public static LocalDate currentWeekStart() {
    return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
  }

  // ────────────────────────────────────────────────────────────────────────

  public record ReconcileInput(
      UUID commitId,
      CommitStatus status,
      String actualOutcome,
      String deltaReason,
      CarryDecision carryDecision,
      String carryRationale) {

    public static List<ReconcileInput> empty() {
      return new ArrayList<>();
    }
  }
}
