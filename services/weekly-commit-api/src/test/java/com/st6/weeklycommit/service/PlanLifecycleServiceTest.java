package com.st6.weeklycommit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import com.st6.weeklycommit.AbstractIntegrationTest;
import com.st6.weeklycommit.domain.enums.CarryDecision;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import com.st6.weeklycommit.domain.enums.PlanState;
import com.st6.weeklycommit.repository.AppUserRepository;
import com.st6.weeklycommit.repository.ChessLayerCategoryRepository;
import com.st6.weeklycommit.repository.StrategicNodeRepository;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import com.st6.weeklycommit.service.CommitService.AddCommitInput;
import com.st6.weeklycommit.service.PlanLifecycleService.ReconcileInput;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class PlanLifecycleServiceTest extends AbstractIntegrationTest {

  @Autowired PlanLifecycleService lifecycle;
  @Autowired CommitService commits;
  @Autowired AppUserRepository users;
  @Autowired StrategicNodeRepository nodes;
  @Autowired ChessLayerCategoryRepository chessLayers;
  @Autowired WeeklyPlanRepository plans;

  // Seeded UUIDs (V9__seed.sql) — using these means we don't have to re-seed per test.
  private static final UUID DEV_IC = UUID.fromString("00000000-0000-0000-0000-0000000000ff");
  private static final UUID OUTCOME_1 = UUID.fromString("00000000-0000-0000-0000-000000004001");
  private static final UUID OUTCOME_2 = UUID.fromString("00000000-0000-0000-0000-000000004008");
  private static final UUID CHESS_OFFENSE = UUID.fromString("00000000-0000-0000-0000-000000000301");

  @Test
  void cannotLockEmptyPlan() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);

    assertThatExceptionOfType(PlanValidationException.class)
        .isThrownBy(() -> lifecycle.lock(plan.getId()));
  }

  @Test
  void cannotLockWhenCommitMissingSupportingOutcome() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);
    commits.add(plan.getId(), new AddCommitInput("Refresh decks", null, "deck v2 published", null, CHESS_OFFENSE, 1));

    assertThatExceptionOfType(PlanValidationException.class)
        .isThrownBy(() -> lifecycle.lock(plan.getId()))
        .satisfies(ex -> assertThat(ex.getErrors()).extracting("field").contains("supportingOutcome"));
  }

  @Test
  void locksWhenAllCommitsAreLinkedAndSnapshotIsCaptured() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);
    commits.add(plan.getId(),
        new AddCommitInput("Ship outbound campaign", null, "first batch sent", OUTCOME_1, CHESS_OFFENSE, 1));
    commits.add(plan.getId(),
        new AddCommitInput("Lock-by-Tuesday nudge", null, "experiment deployed", OUTCOME_2, CHESS_OFFENSE, 2));

    var locked = lifecycle.lock(plan.getId());
    assertThat(locked.getState()).isEqualTo(PlanState.LOCKED);
    assertThat(locked.getLockedAt()).isNotNull();
    assertThat(locked.activeCommits())
        .allSatisfy(c -> {
          assertThat(c.getLockedOutcomePath()).isNotNull().contains("›");
          assertThat(c.getLockedOutcomeTitles()).isNotEmpty();
        });
  }

  @Test
  void fullHappyPathDraftToReconciledIncludingCarryForward() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);
    var commit1 = commits.add(plan.getId(),
        new AddCommitInput("Ship outbound campaign", null, "first batch sent", OUTCOME_1, CHESS_OFFENSE, 1));
    var commit2 = commits.add(plan.getId(),
        new AddCommitInput("Lock-by-Tuesday nudge", null, "experiment deployed", OUTCOME_2, CHESS_OFFENSE, 2));

    lifecycle.lock(plan.getId());
    lifecycle.startReconciliation(plan.getId());

    var inputs = List.of(
        new ReconcileInput(commit1.getId(), CommitStatus.DELIVERED, null, null, null, null),
        new ReconcileInput(
            commit2.getId(),
            CommitStatus.PARTIAL,
            "Got halfway through the experiment",
            "Vendor delays on the email service made the second batch slip",
            CarryDecision.CARRY_FORWARD,
            "Carrying because the vendor confirmed sending capacity returns Monday and the test is still meaningful."));

    var reconciled = lifecycle.reconcile(plan.getId(), inputs);
    assertThat(reconciled.getState()).isEqualTo(PlanState.RECONCILED);
    assertThat(reconciled.getReconciledAt()).isNotNull();

    // Carry-forward materialised a child commit in next week's plan.
    var nextWeek = plan.getWeekStartDate().plusWeeks(1);
    var nextPlan = plans.findActiveByUserAndWeek(user.getId(), nextWeek).orElseThrow();
    var children = nextPlan.activeCommits();
    assertThat(children).hasSize(1);
    var child = children.get(0);
    assertThat(child.getCarryGeneration()).isEqualTo(2);
    assertThat(child.getSourceCommit().getId()).isEqualTo(commit2.getId());
    assertThat(child.getTitle()).isEqualTo(commit2.getTitle());
  }

  @Test
  void cannotReconcileFromDraft() {
    var user = users.findById(DEV_IC).orElseThrow();
    var plan = lifecycle.createPlanForCurrentWeek(user);
    assertThatExceptionOfType(IllegalStateTransitionException.class)
        .isThrownBy(() -> lifecycle.reconcile(plan.getId(), List.of()));
  }

  @Test
  void createPlanForCurrentWeekIsIdempotent() {
    var user = users.findById(DEV_IC).orElseThrow();
    var first = lifecycle.createPlanForCurrentWeek(user);
    var second = lifecycle.createPlanForCurrentWeek(user);
    assertThat(first.getId()).isEqualTo(second.getId());
  }
}
