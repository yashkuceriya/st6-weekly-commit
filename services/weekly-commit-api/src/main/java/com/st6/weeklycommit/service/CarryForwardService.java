package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.AppUser;
import com.st6.weeklycommit.domain.CommitReconciliation;
import com.st6.weeklycommit.domain.WeeklyCommit;
import com.st6.weeklycommit.domain.WeeklyPlan;
import com.st6.weeklycommit.domain.enums.PlanState;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import java.time.Instant;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Materialises a Carry Forward decision into an actual child commit in the
 * NEXT week's plan. Creates the next-week plan in DRAFT state if it doesn't
 * already exist.
 *
 * <p>The child commit:
 *
 * <ul>
 *   <li>references the source via {@code source_commit_id} (provenance),
 *   <li>increments {@code carry_generation},
 *   <li>flips {@code requires_manager_ack} on at the configured generation
 *       (default: 3rd carry),
 *   <li>copies title, rationale, expected evidence, supporting outcome,
 *       chess layer, and priority — the user can edit before locking.
 * </ul>
 *
 * <p>The reconciliation row is updated with {@code next_commit_id} so the
 * historical record links forward.
 */
@Service
public class CarryForwardService {

  private final WeeklyPlanRepository plans;

  public CarryForwardService(WeeklyPlanRepository plans) {
    this.plans = plans;
  }

  @Transactional
  public WeeklyCommit materialize(WeeklyCommit source, CommitReconciliation rec) {
    var owner = source.getPlan().getUser();
    var nextWeek = source.getPlan().getWeekStartDate().plusWeeks(1);
    var nextPlan = findOrCreateNextPlan(owner, nextWeek);

    var child = new WeeklyCommit();
    child.setPlan(nextPlan);
    child.setTitle(source.getTitle());
    child.setRationale(source.getRationale());
    child.setExpectedEvidence(source.getExpectedEvidence());
    child.setSupportingOutcome(source.getSupportingOutcome());
    child.setChessLayerCategory(source.getChessLayerCategory());
    child.setPriorityRank(source.getPriorityRank());
    child.setSourceCommit(source);
    child.setCarryGeneration(source.getCarryGeneration() + 1);
    child.setRequiresManagerAck(PlanGuards.requiresManagerAckAt(child.getCarryGeneration()));
    child.setActive(true);

    nextPlan.getCommits().add(child);
    rec.setNextCommit(child);
    return child;
  }

  private WeeklyPlan findOrCreateNextPlan(AppUser owner, LocalDate week) {
    return plans
        .findActiveByUserAndWeek(owner.getId(), week)
        .orElseGet(
            () -> {
              var p = new WeeklyPlan();
              p.setUser(owner);
              p.setWeekStartDate(week);
              p.setState(PlanState.DRAFT);
              p.setDraftedAt(Instant.now());
              return plans.save(p);
            });
  }
}
