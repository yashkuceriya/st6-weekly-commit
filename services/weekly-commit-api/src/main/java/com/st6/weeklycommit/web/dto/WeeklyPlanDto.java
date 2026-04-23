package com.st6.weeklycommit.web.dto;

import com.st6.weeklycommit.domain.enums.PlanState;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record WeeklyPlanDto(
    UUID id,
    UUID userId,
    String userDisplayName,
    LocalDate weekStartDate,
    PlanState state,
    Instant draftedAt,
    Instant lockedAt,
    Instant reconciliationStartedAt,
    Instant reconciledAt,
    Instant reviewedAt,
    long version,
    List<WeeklyCommitDto> commits,
    ManagerReviewDto review) {}
