package com.st6.weeklycommit.web.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record WeeklyCommitDto(
    UUID id,
    UUID planId,
    String title,
    String rationale,
    String expectedEvidence,
    UUID supportingOutcomeId,
    UUID chessLayerCategoryId,
    int priorityRank,
    String lockedOutcomePath,
    Map<String, String> lockedOutcomeTitles,
    UUID sourceCommitId,
    int carryGeneration,
    boolean requiresManagerAck,
    boolean active,
    CommitReconciliationDto reconciliation,
    long version,
    Instant createdAt,
    Instant updatedAt) {}
