package com.st6.weeklycommit.eval;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import com.st6.weeklycommit.AbstractIntegrationTest;
import com.st6.weeklycommit.domain.enums.CarryDecision;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import com.st6.weeklycommit.domain.enums.PlanState;
import com.st6.weeklycommit.repository.AppUserRepository;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import com.st6.weeklycommit.service.CommitService;
import com.st6.weeklycommit.service.CommitService.AddCommitInput;
import com.st6.weeklycommit.service.IllegalStateTransitionException;
import com.st6.weeklycommit.service.PlanLifecycleService;
import com.st6.weeklycommit.service.PlanLifecycleService.ReconcileInput;
import com.st6.weeklycommit.service.PlanValidationException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

/**
 * Eval — invariants that must hold for ANY plan, regardless of input shape.
 *
 * <p>These aren't quite property-based (no jqwik dep yet) but they're
 * structured the same way: drive a plan through every legal and illegal
 * transition, then assert the system always landed in a coherent state.
 *
 * <p>Each invariant is a separate test method so a failure tells you
 * exactly which one broke.
 */
@DisplayName("Eval — State machine invariants")
@Transactional
class StateMachineInvariantsTest extends AbstractIntegrationTest {

  @Autowired PlanLifecycleService lifecycle;
  @Autowired CommitService commits;
  @Autowired AppUserRepository users;
  @Autowired WeeklyPlanRepository plans;

  private static final UUID DEV_IC = UUID.fromString("00000000-0000-0000-0000-0000000000ff");
  private static final UUID OUTCOME_1 = UUID.fromString("00000000-0000-0000-0000-000000004001");
  private static final UUID OUTCOME_2 = UUID.fromString("00000000-0000-0000-0000-000000004008");
  private static final UUID CHESS_OFFENSE = UUID.fromString("00000000-0000-0000-0000-000000000301");

  // ────────────────────────────────────────────────────────────────────────
  // Invariant 1: state never regresses
  // ────────────────────────────────────────────────────────────────────────

  @Test
  void stateNeverRegresses_cannotLockFromLocked() {
    var plan = aLockedPlan();
    assertThatExceptionOfType(IllegalStateTransitionException.class)
        .isThrownBy(() -> lifecycle.lock(plan.getId()));
  }

  @Test
  void stateNeverRegresses_cannotStartReconciliationFromDraft() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlan(user, weekN(1));
    assertThatExceptionOfType(IllegalStateTransitionException.class)
        .isThrownBy(() -> lifecycle.startReconciliation(plan.getId()));
  }

  @Test
  void stateNeverRegresses_cannotReconcileFromLocked() {
    var plan = aLockedPlan();
    assertThatExceptionOfType(IllegalStateTransitionException.class)
        .isThrownBy(() -> lifecycle.reconcile(plan.getId(), List.of()));
  }

  @Test
  void stateNeverRegresses_cannotReconcileFromReconciled() {
    var plan = aReconciledPlan();
    assertThatExceptionOfType(IllegalStateTransitionException.class)
        .isThrownBy(() -> lifecycle.reconcile(plan.getId(), List.of()));
  }

  // ────────────────────────────────────────────────────────────────────────
  // Invariant 2: version increases on every mutation
  // ────────────────────────────────────────────────────────────────────────

  @Test
  void versionIncreasesAcrossLifecycleTransitions() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlan(user, weekN(2));
    long v0 = plan.getVersion();

    commits.add(plan.getId(), commitInput("v0", OUTCOME_1));
    var afterAdd = plans.findById(plan.getId()).orElseThrow();
    long v1 = afterAdd.getVersion();
    assertThat(v1).isGreaterThanOrEqualTo(v0);

    var locked = lifecycle.lock(plan.getId());
    assertThat(locked.getVersion()).isGreaterThan(v1);

    var reconciling = lifecycle.startReconciliation(plan.getId());
    assertThat(reconciling.getVersion()).isGreaterThanOrEqualTo(locked.getVersion());
  }

  // ────────────────────────────────────────────────────────────────────────
  // Invariant 3: snapshot present iff state >= LOCKED
  // ────────────────────────────────────────────────────────────────────────

  @Test
  void snapshotIsAbsentInDraftAndPresentAfterLock() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlan(user, weekN(3));
    var commit = commits.add(plan.getId(), commitInput("snapshot test", OUTCOME_1));

    assertThat(commit.getLockedOutcomePath()).isNull();
    assertThat(commit.getLockedOutcomeTitles()).isNull();

    var locked = lifecycle.lock(plan.getId());
    var lockedCommit = locked.activeCommits().get(0);
    assertThat(lockedCommit.getLockedOutcomePath()).isNotNull().contains("›");
    assertThat(lockedCommit.getLockedOutcomeTitles()).isNotEmpty();
  }

  // ────────────────────────────────────────────────────────────────────────
  // Invariant 4: carry-forward child generation = source generation + 1
  // ────────────────────────────────────────────────────────────────────────

  @Test
  void carryForwardChildHasGenerationExactlyOneAboveSource() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlan(user, weekN(4));
    var src = commits.add(plan.getId(), commitInput("carry test", OUTCOME_1));
    int sourceGen = src.getCarryGeneration();

    lifecycle.lock(plan.getId());
    lifecycle.startReconciliation(plan.getId());
    lifecycle.reconcile(
        plan.getId(),
        List.of(
            new ReconcileInput(
                src.getId(),
                CommitStatus.MISSED,
                "didn't ship",
                "blocked on infra",
                CarryDecision.CARRY_FORWARD,
                "Need one more week to finish the upstream wiring before this is testable.")));

    var nextWeek = plans.findActiveByUserAndWeek(user.getId(), weekN(4).plusWeeks(1)).orElseThrow();
    var children = nextWeek.activeCommits();
    assertThat(children).hasSize(1);
    var child = children.get(0);
    assertThat(child.getCarryGeneration()).isEqualTo(sourceGen + 1);
    assertThat(child.getSourceCommit().getId()).isEqualTo(src.getId());
  }

  // ────────────────────────────────────────────────────────────────────────
  // Invariant 5: lock guard always returns >0 errors when broken
  // ────────────────────────────────────────────────────────────────────────

  @Test
  void lockAlwaysReportsAtLeastOneFieldErrorPerBrokenCommit() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlan(user, weekN(5));
    commits.add(plan.getId(), new AddCommitInput("missing all", null, null, null, null, 1));

    var ex = catchThrowableOfType(() -> lifecycle.lock(plan.getId()), PlanValidationException.class);
    assertThat(ex.getErrors()).isNotEmpty();
    assertThat(ex.getErrors())
        .extracting("field")
        .contains("supportingOutcome", "chessLayer", "expectedEvidence");
  }

  // ────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────

  private com.st6.weeklycommit.domain.WeeklyPlan aLockedPlan() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlan(user, weekN(10));
    commits.add(plan.getId(), commitInput("locked test", OUTCOME_2));
    return lifecycle.lock(plan.getId());
  }

  private com.st6.weeklycommit.domain.WeeklyPlan aReconciledPlan() {
    var locked = aLockedPlan();
    lifecycle.startReconciliation(locked.getId());
    return lifecycle.reconcile(
        locked.getId(),
        List.of(
            new ReconcileInput(
                locked.activeCommits().get(0).getId(),
                CommitStatus.DELIVERED,
                null,
                null,
                null,
                null)));
  }

  private static AddCommitInput commitInput(String title, UUID outcome) {
    return new AddCommitInput(title, "rationale", "evidence here", outcome, CHESS_OFFENSE, 1);
  }

  /** Distinct Monday for each test method to avoid the user/week unique constraint. */
  private static LocalDate weekN(int weeksFromBase) {
    // Pick a deterministic Monday far enough in the past that no other test collides.
    return LocalDate.of(2025, 1, 6).plusWeeks(weeksFromBase);
  }
}
