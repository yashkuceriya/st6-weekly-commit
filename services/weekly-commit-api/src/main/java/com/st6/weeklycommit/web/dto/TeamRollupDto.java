package com.st6.weeklycommit.web.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Top-of-page metrics for the manager view. Each field maps to an impact
 * metric in the brief — see CLAUDE.md.
 */
public record TeamRollupDto(
    UUID teamId,
    LocalDate weekStartDate,
    int totalReports,
    int alignmentPercent,
    int planningCompletionPercent,
    int reconciliationAccuracyPercent,
    int reviewSlaMetPercent,
    int carryForwardRate,
    Long timeToPlanMedianMinutes,
    int outcomeCoverageCount) {}
