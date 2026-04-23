package com.st6.weeklycommit.web.dto;

import com.st6.weeklycommit.domain.ChessLayerCategory;
import com.st6.weeklycommit.domain.CommitReconciliation;
import com.st6.weeklycommit.domain.ManagerReview;
import com.st6.weeklycommit.domain.StrategicNode;
import com.st6.weeklycommit.domain.WeeklyCommit;
import com.st6.weeklycommit.domain.WeeklyPlan;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Hand-rolled entity → DTO conversions. MapStruct would be lighter on
 * keystrokes but explicit conversion makes the wire shape obvious — and the
 * shape is the contract the FE depends on.
 */
public final class Mappers {
  private Mappers() {}

  public static StrategicNodeDto toDto(StrategicNode n) {
    return new StrategicNodeDto(
        n.getId(),
        n.getType(),
        n.getParent() == null ? null : n.getParent().getId(),
        n.getTitle(),
        n.getDescription(),
        n.getOwningTeam() == null ? null : n.getOwningTeam().getId(),
        n.isActive(),
        n.getActiveFrom(),
        n.getActiveUntil(),
        n.getDisplayOrder(),
        new ArrayList<>());
  }

  public static StrategicNodeDto toDtoWithChildren(StrategicNode n, List<StrategicNodeDto> children) {
    return new StrategicNodeDto(
        n.getId(),
        n.getType(),
        n.getParent() == null ? null : n.getParent().getId(),
        n.getTitle(),
        n.getDescription(),
        n.getOwningTeam() == null ? null : n.getOwningTeam().getId(),
        n.isActive(),
        n.getActiveFrom(),
        n.getActiveUntil(),
        n.getDisplayOrder(),
        children);
  }

  public static ChessLayerDto toDto(ChessLayerCategory c) {
    return new ChessLayerDto(
        c.getId(),
        c.getName(),
        c.getDescription(),
        c.getColor(),
        c.getDisplayOrder(),
        c.getWeight(),
        c.isDefault(),
        c.isActive());
  }

  public static WeeklyPlanDto toDto(WeeklyPlan p) {
    var commits = new ArrayList<WeeklyCommitDto>();
    for (var c : p.getCommits()) {
      if (c.isActive()) commits.add(toDto(c));
    }
    var reviewedAt = p.getReview() == null ? null : p.getReview().getReviewedAt();
    return new WeeklyPlanDto(
        p.getId(),
        p.getUser().getId(),
        p.getUser().getDisplayName(),
        p.getWeekStartDate(),
        p.getState(),
        p.getDraftedAt(),
        p.getLockedAt(),
        p.getReconciliationStartedAt(),
        p.getReconciledAt(),
        reviewedAt,
        p.getVersion(),
        commits,
        p.getReview() == null ? null : toDto(p.getReview()));
  }

  public static WeeklyCommitDto toDto(WeeklyCommit c) {
    Map<String, String> titles =
        c.getLockedOutcomeTitles() == null ? null : new HashMap<>(c.getLockedOutcomeTitles());
    return new WeeklyCommitDto(
        c.getId(),
        c.getPlan().getId(),
        c.getTitle(),
        c.getRationale(),
        c.getExpectedEvidence(),
        c.getSupportingOutcome() == null ? null : c.getSupportingOutcome().getId(),
        c.getChessLayerCategory() == null ? null : c.getChessLayerCategory().getId(),
        c.getPriorityRank(),
        c.getLockedOutcomePath(),
        titles,
        c.getSourceCommit() == null ? null : c.getSourceCommit().getId(),
        c.getCarryGeneration(),
        c.isRequiresManagerAck(),
        c.isActive(),
        c.getReconciliation() == null ? null : toDto(c.getReconciliation()),
        c.getVersion(),
        c.getCreatedAt(),
        c.getUpdatedAt());
  }

  public static CommitReconciliationDto toDto(CommitReconciliation r) {
    return new CommitReconciliationDto(
        r.getId(),
        r.getCommit().getId(),
        r.getStatus(),
        r.getActualOutcome(),
        r.getDeltaReason(),
        r.getCarryDecision(),
        r.getCarryRationale(),
        r.getNextCommit() == null ? null : r.getNextCommit().getId(),
        r.getReconciledAt());
  }

  public static ManagerReviewDto toDto(ManagerReview r) {
    return new ManagerReviewDto(
        r.getId(),
        r.getPlan().getId(),
        r.getReviewer().getId(),
        r.getReviewer().getDisplayName(),
        r.getReviewedAt(),
        r.getStatus(),
        r.getSummaryNote());
  }
}
