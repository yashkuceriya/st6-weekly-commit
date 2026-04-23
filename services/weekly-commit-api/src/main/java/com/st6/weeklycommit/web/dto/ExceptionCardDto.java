package com.st6.weeklycommit.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Manager-queue exception card. One shape covers all card types via nullable
 * extra fields rather than per-type subclasses — keeps the wire flat and
 * matches the discriminated-union shape on the FE (shared-types/exceptions.ts).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ExceptionCardDto(
    UUID id,
    String type, // matches FE ExceptionType enum
    Instant detectedAt,
    String severity, // info | warning | critical
    UUID reportUserId,
    String reportUserDisplayName,

    // Optional — depending on type
    LocalDate weekStartDate,
    Integer hoursOverdue,
    UUID planId,
    Integer hoursPending,
    UUID commitId,
    String commitTitle,
    Integer carryGeneration,
    UUID rootCommitId,
    UUID outcomeId,
    String outcomeTitle,
    Integer weeksUncovered,
    Integer priorityRank,
    String deltaReason) {}
