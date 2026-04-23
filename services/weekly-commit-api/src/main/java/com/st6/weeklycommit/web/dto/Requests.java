package com.st6.weeklycommit.web.dto;

import com.st6.weeklycommit.domain.enums.CarryDecision;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import com.st6.weeklycommit.domain.enums.ReviewStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Request payloads. Grouped here so the controller signature stays focused. */
public final class Requests {
  private Requests() {}

  public record CreatePlanRequest(LocalDate weekStartDate) {}

  public record CreateCommitRequest(
      @NotBlank String title,
      String rationale,
      String expectedEvidence,
      UUID supportingOutcomeId,
      UUID chessLayerCategoryId,
      Integer priorityRank) {}

  public record UpdateCommitRequest(
      @NotBlank String title,
      String rationale,
      String expectedEvidence,
      UUID supportingOutcomeId,
      UUID chessLayerCategoryId,
      Integer priorityRank,
      @NotNull @Min(0) Long version) {}

  public record ReconcileCommitInput(
      @NotNull UUID commitId,
      @NotNull CommitStatus status,
      String actualOutcome,
      String deltaReason,
      CarryDecision carryDecision,
      String carryRationale) {}

  public record ReconcilePlanRequest(@NotNull List<ReconcileCommitInput> reconciliations) {}

  public record SubmitReviewRequest(@NotNull ReviewStatus status, String summaryNote) {}
}
