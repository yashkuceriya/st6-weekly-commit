package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.WeeklyPlan;
import com.st6.weeklycommit.domain.enums.CarryDecision;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import com.st6.weeklycommit.service.PlanLifecycleService.ReconcileInput;
import com.st6.weeklycommit.service.PlanValidationException.FieldError;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Validation guards for state transitions. Kept separate from
 * {@link PlanLifecycleService} because the guard logic is what evolves over
 * time as the product learns.
 *
 * <p>Each guard either passes silently or throws {@link PlanValidationException}
 * with field-level errors keyed by commit id, so the API can surface them
 * per-commit on the planner UI.
 */
@Component
public class PlanGuards {

  private static final int CARRY_GENERATION_REQUIRES_LONGER_RATIONALE = 2;
  private static final int CARRY_GENERATION_REQUIRES_MANAGER_ACK = 3;

  /**
   * The hard alignment rule: every active commit must have a supporting
   * outcome, chess-layer category, priority, and expected evidence. This is
   * the WHOLE thesis of the product — make it explicit, make it field-level,
   * make it impossible to bypass.
   */
  public void guardLock(WeeklyPlan plan) {
    var errors = new ArrayList<FieldError>();
    var commits = plan.activeCommits();

    if (commits.isEmpty()) {
      throw new PlanValidationException(
          "Cannot lock a plan with no commits.",
          List.of(new FieldError(null, "commits", "Add at least one commit before locking.")));
    }

    for (var c : commits) {
      var id = c.getId() == null ? null : c.getId().toString();
      if (c.getSupportingOutcome() == null) {
        errors.add(new FieldError(id, "supportingOutcome",
            "Pick a Supporting Outcome — every commit must map to strategy."));
      }
      if (c.getChessLayerCategory() == null) {
        errors.add(new FieldError(id, "chessLayer",
            "Pick a chess layer category."));
      }
      if (c.getPriorityRank() < 1) {
        errors.add(new FieldError(id, "priority",
            "Set a priority rank (1 = most important)."));
      }
      if (c.getExpectedEvidence() == null || c.getExpectedEvidence().isBlank()) {
        errors.add(new FieldError(id, "expectedEvidence",
            "Describe how you'll know this is done."));
      }
    }

    if (!errors.isEmpty()) {
      throw new PlanValidationException(
          "Cannot lock — " + errors.size() + " commit(s) need attention.", errors);
    }
  }

  /**
   * Reconciliation guard: every active commit needs an input row, status
   * matches carry decision rules, and the carry-escalation rationale grows
   * stricter with each generation.
   */
  public void guardReconcile(WeeklyPlan plan, List<ReconcileInput> inputs) {
    var errors = new ArrayList<FieldError>();
    var byId = new HashMap<String, ReconcileInput>();
    for (var i : inputs) {
      if (i.commitId() != null) byId.put(i.commitId().toString(), i);
    }

    for (var c : plan.activeCommits()) {
      var id = c.getId().toString();
      var input = byId.get(id);
      if (input == null) {
        errors.add(new FieldError(id, "status", "Each commit needs a disposition."));
        continue;
      }

      if (input.status() == null) {
        errors.add(new FieldError(id, "status", "Status (Delivered/Partial/Missed) is required."));
        continue;
      }

      if (input.status() != CommitStatus.DELIVERED) {
        if (isBlank(input.actualOutcome())) {
          errors.add(new FieldError(id, "actualOutcome",
              "Describe what actually happened (required when not Delivered)."));
        }
        if (isBlank(input.deltaReason())) {
          errors.add(new FieldError(id, "deltaReason",
              "Why did this go differently? (required when not Delivered)."));
        }
        if (input.carryDecision() == null) {
          errors.add(new FieldError(id, "carryDecision",
              "Decide: drop, finish next week, or carry forward."));
        }

        if (input.carryDecision() == CarryDecision.CARRY_FORWARD) {
          // Escalation rule scales with generation. The CURRENT commit's
          // generation is c.getCarryGeneration(); a CARRY_FORWARD here
          // creates a child at generation+1. We enforce on the child's
          // requirements pre-emptively to avoid surprising the user.
          int nextGen = c.getCarryGeneration() + 1;
          if (nextGen >= CARRY_GENERATION_REQUIRES_LONGER_RATIONALE
              && (isBlank(input.carryRationale()) || input.carryRationale().length() < 60)) {
            errors.add(new FieldError(id, "carryRationale",
                "This is the " + ordinal(nextGen) + " carry — write a longer rationale (≥ 60 chars)."));
          }
          // The manager-ack flag is set on the child commit at materialize time;
          // no validation error here, just a UX banner in the FE.
        }
      }
    }

    if (!errors.isEmpty()) {
      throw new PlanValidationException(
          "Cannot reconcile — " + errors.size() + " issue(s) to address.", errors);
    }
  }

  static boolean isBlank(String s) {
    return s == null || s.isBlank();
  }

  static String ordinal(int n) {
    return switch (n) {
      case 1 -> "1st";
      case 2 -> "2nd";
      case 3 -> "3rd";
      default -> n + "th";
    };
  }

  public static boolean requiresManagerAckAt(int generation) {
    return generation >= CARRY_GENERATION_REQUIRES_MANAGER_ACK;
  }
}
