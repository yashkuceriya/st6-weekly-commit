package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.ChessLayerCategory;
import com.st6.weeklycommit.domain.WeeklyCommit;
import com.st6.weeklycommit.domain.WeeklyPlan;
import com.st6.weeklycommit.domain.enums.PlanState;
import com.st6.weeklycommit.repository.ChessLayerCategoryRepository;
import com.st6.weeklycommit.repository.WeeklyCommitRepository;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Commit CRUD with the "drafts can be incomplete; lock enforces completeness"
 * rule. Mutations are rejected outside the DRAFT state — manager corrections
 * to a locked plan would be a separate flow (out of scope for the take-home;
 * see CLAUDE.md).
 */
@Service
public class CommitService {

  private final WeeklyPlanRepository plans;
  private final WeeklyCommitRepository commits;
  private final ChessLayerCategoryRepository chessLayers;
  private final StrategicPathResolver paths;

  public CommitService(
      WeeklyPlanRepository plans,
      WeeklyCommitRepository commits,
      ChessLayerCategoryRepository chessLayers,
      StrategicPathResolver paths) {
    this.plans = plans;
    this.commits = commits;
    this.chessLayers = chessLayers;
    this.paths = paths;
  }

  @Transactional
  public WeeklyCommit add(UUID planId, AddCommitInput input) {
    var plan = requireMutable(planId);
    var commit = new WeeklyCommit();
    commit.setPlan(plan);
    apply(commit, input);
    plan.getCommits().add(commit);
    if (plan.getFirstEditAt() == null) {
      plan.setFirstEditAt(Instant.now());
    }
    return commits.save(commit);
  }

  @Transactional
  public WeeklyCommit update(UUID commitId, AddCommitInput input, long expectedVersion) {
    var commit =
        commits
            .findById(commitId)
            .orElseThrow(() -> new IllegalArgumentException("Commit not found: " + commitId));
    requireMutable(commit.getPlan().getId());
    if (commit.getVersion() != expectedVersion) {
      throw new org.springframework.orm.ObjectOptimisticLockingFailureException(
          WeeklyCommit.class, commit.getId());
    }
    apply(commit, input);
    return commit;
  }

  @Transactional
  public void delete(UUID commitId) {
    var commit =
        commits
            .findById(commitId)
            .orElseThrow(() -> new IllegalArgumentException("Commit not found: " + commitId));
    requireMutable(commit.getPlan().getId());
    commit.setActive(false);
    commit.setDeletedAt(Instant.now());
  }

  // ────────────────────────────────────────────────────────────────────────

  private WeeklyPlan requireMutable(UUID planId) {
    var plan =
        plans.findById(planId).orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
    if (plan.getState() != PlanState.DRAFT) {
      throw new IllegalStateException(
          "Plan " + planId + " is " + plan.getState() + " — only DRAFT plans accept commit edits.");
    }
    return plan;
  }

  private void apply(WeeklyCommit commit, AddCommitInput input) {
    commit.setTitle(input.title());
    commit.setRationale(input.rationale());
    commit.setExpectedEvidence(input.expectedEvidence());
    commit.setPriorityRank(input.priorityRank() == null ? 1 : input.priorityRank());

    if (input.supportingOutcomeId() != null) {
      var node = paths.requireSupportingOutcome(input.supportingOutcomeId());
      commit.setSupportingOutcome(node);
    } else {
      commit.setSupportingOutcome(null);
    }

    if (input.chessLayerCategoryId() != null) {
      ChessLayerCategory cat =
          chessLayers
              .findById(input.chessLayerCategoryId())
              .orElseThrow(
                  () -> new IllegalArgumentException(
                      "Chess layer not found: " + input.chessLayerCategoryId()));
      commit.setChessLayerCategory(cat);
    } else {
      commit.setChessLayerCategory(null);
    }
  }

  public record AddCommitInput(
      String title,
      String rationale,
      String expectedEvidence,
      UUID supportingOutcomeId,
      UUID chessLayerCategoryId,
      Integer priorityRank) {}
}
