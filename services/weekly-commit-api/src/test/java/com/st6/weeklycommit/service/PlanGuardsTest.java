package com.st6.weeklycommit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import com.st6.weeklycommit.domain.ChessLayerCategory;
import com.st6.weeklycommit.domain.StrategicNode;
import com.st6.weeklycommit.domain.WeeklyCommit;
import com.st6.weeklycommit.domain.WeeklyPlan;
import com.st6.weeklycommit.domain.enums.CarryDecision;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import com.st6.weeklycommit.domain.enums.StrategicNodeType;
import com.st6.weeklycommit.service.PlanLifecycleService.ReconcileInput;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Pure-unit tests for the alignment-enforcement guards. No Spring, no DB —
 * just the rules. The guards are the heart of the product thesis.
 */
class PlanGuardsTest {

  private final PlanGuards guards = new PlanGuards();

  // ────────────────────────────────────────────────────────────────────────
  // LOCK guard
  // ────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("LOCK guard — every commit must map to a Supporting Outcome")
  class LockGuard {

    @Test
    void rejectsLockOnEmptyPlan() {
      var plan = newPlan();
      assertThatExceptionOfType(PlanValidationException.class)
          .isThrownBy(() -> guards.guardLock(plan))
          .withMessageContaining("no commits");
    }

    @Test
    void rejectsLockWhenAnyCommitLacksSupportingOutcome() {
      var plan = newPlan();
      plan.getCommits().add(commit(plan, /*outcome*/ true, /*chess*/ true, /*evidence*/ "tests pass"));
      plan.getCommits().add(commit(plan, /*outcome*/ false, /*chess*/ true, /*evidence*/ "doc updated"));

      var ex =
          catchThrowableOfType(() -> guards.guardLock(plan), PlanValidationException.class);
      assertThat(ex.getErrors()).extracting(PlanValidationException.FieldError::field)
          .contains("supportingOutcome");
    }

    @Test
    void rejectsLockWhenChessLayerMissing() {
      var plan = newPlan();
      plan.getCommits().add(commit(plan, true, false, "tests pass"));

      var ex =
          catchThrowableOfType(() -> guards.guardLock(plan), PlanValidationException.class);
      assertThat(ex.getErrors()).extracting(PlanValidationException.FieldError::field)
          .contains("chessLayer");
    }

    @Test
    void rejectsLockWhenEvidenceMissing() {
      var plan = newPlan();
      plan.getCommits().add(commit(plan, true, true, ""));

      var ex =
          catchThrowableOfType(() -> guards.guardLock(plan), PlanValidationException.class);
      assertThat(ex.getErrors()).extracting(PlanValidationException.FieldError::field)
          .contains("expectedEvidence");
    }

    @Test
    void surfacesAllErrorsAtOnceNotJustTheFirst() {
      var plan = newPlan();
      plan.getCommits().add(commit(plan, false, false, ""));

      var ex =
          catchThrowableOfType(() -> guards.guardLock(plan), PlanValidationException.class);
      assertThat(ex.getErrors())
          .hasSizeGreaterThanOrEqualTo(3)
          .extracting(PlanValidationException.FieldError::field)
          .contains("supportingOutcome", "chessLayer", "expectedEvidence");
    }

    @Test
    void allowsLockWhenEverythingIsLinked() {
      var plan = newPlan();
      plan.getCommits().add(commit(plan, true, true, "demo recorded"));
      plan.getCommits().add(commit(plan, true, true, "PR merged"));

      assertThatNoException().isThrownBy(() -> guards.guardLock(plan));
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // RECONCILE guard — escalation rule
  // ────────────────────────────────────────────────────────────────────────

  @Nested
  @DisplayName("RECONCILE guard — carry-forward escalation")
  class ReconcileGuard {

    @Test
    void rejectsMissingDispositionForAnyCommit() {
      var plan = newPlan();
      var c1 = commit(plan, true, true, "evidence");
      c1.setId(UUID.randomUUID());
      plan.getCommits().add(c1);

      var ex =
          catchThrowableOfType(() -> guards.guardReconcile(plan, List.of()), PlanValidationException.class);
      assertThat(ex.getErrors()).extracting(PlanValidationException.FieldError::field).contains("status");
    }

    @Test
    void rejectsPartialOrMissedWithoutActualOrReason() {
      var plan = newPlan();
      var c = commit(plan, true, true, "evidence");
      c.setId(UUID.randomUUID());
      plan.getCommits().add(c);

      var inputs =
          List.of(new ReconcileInput(c.getId(), CommitStatus.MISSED, null, null, CarryDecision.DROP, null));
      var ex =
          catchThrowableOfType(() -> guards.guardReconcile(plan, inputs), PlanValidationException.class);
      assertThat(ex.getErrors())
          .extracting(PlanValidationException.FieldError::field)
          .contains("actualOutcome", "deltaReason");
    }

    @Test
    void firstCarryForwardAcceptsShortRationale() {
      var plan = newPlan();
      var c = commit(plan, true, true, "evidence");
      c.setId(UUID.randomUUID());
      c.setCarryGeneration(1); // first carry creates a child at gen 2
      plan.getCommits().add(c);

      var inputs =
          List.of(
              new ReconcileInput(
                  c.getId(),
                  CommitStatus.PARTIAL,
                  "Got halfway",
                  "Blocked on review",
                  CarryDecision.CARRY_FORWARD,
                  "Carrying because review still pending."));

      // gen 2 (the child) requires longer rationale (>= 60). Should fail.
      var ex =
          catchThrowableOfType(() -> guards.guardReconcile(plan, inputs), PlanValidationException.class);
      assertThat(ex.getErrors()).extracting(PlanValidationException.FieldError::field).contains("carryRationale");
    }

    @Test
    void carryForwardAtGen2RequiresLongerRationale() {
      var plan = newPlan();
      var c = commit(plan, true, true, "evidence");
      c.setId(UUID.randomUUID());
      c.setCarryGeneration(1);
      plan.getCommits().add(c);

      var inputs =
          List.of(
              new ReconcileInput(
                  c.getId(),
                  CommitStatus.PARTIAL,
                  "Got halfway",
                  "Blocked on review from product team for the third sprint.",
                  CarryDecision.CARRY_FORWARD,
                  "Carrying because the upstream API change still hasn't shipped after two weeks of follow-ups."));

      assertThatNoException().isThrownBy(() -> guards.guardReconcile(plan, inputs));
    }

    @Test
    void thirdCarryFlagsRequiresManagerAck() {
      assertThat(PlanGuards.requiresManagerAckAt(2)).isFalse();
      assertThat(PlanGuards.requiresManagerAckAt(3)).isTrue();
      assertThat(PlanGuards.requiresManagerAckAt(4)).isTrue();
    }

    @Test
    void allowsDeliveredWithoutCarryDecision() {
      var plan = newPlan();
      var c = commit(plan, true, true, "evidence");
      c.setId(UUID.randomUUID());
      plan.getCommits().add(c);

      var inputs =
          List.of(new ReconcileInput(c.getId(), CommitStatus.DELIVERED, null, null, null, null));

      assertThatNoException().isThrownBy(() -> guards.guardReconcile(plan, inputs));
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Builders
  // ────────────────────────────────────────────────────────────────────────

  private static WeeklyPlan newPlan() {
    var p = new WeeklyPlan();
    return p;
  }

  private static WeeklyCommit commit(
      WeeklyPlan plan, boolean withOutcome, boolean withChess, String evidence) {
    var c = new WeeklyCommit();
    c.setPlan(plan);
    c.setTitle("Test commit");
    c.setExpectedEvidence(evidence);
    c.setPriorityRank(1);
    if (withOutcome) {
      var node = new StrategicNode();
      node.setId(UUID.randomUUID());
      node.setType(StrategicNodeType.SUPPORTING_OUTCOME);
      node.setTitle("Supporting outcome");
      c.setSupportingOutcome(node);
    }
    if (withChess) {
      var cat = new ChessLayerCategory();
      cat.setId(UUID.randomUUID());
      cat.setName("Offense");
      c.setChessLayerCategory(cat);
    }
    return c;
  }
}
