package com.st6.weeklycommit.web.dto;

import com.st6.weeklycommit.domain.enums.CarryDecision;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import java.time.Instant;
import java.util.UUID;

public record CommitReconciliationDto(
    UUID id,
    UUID commitId,
    CommitStatus status,
    String actualOutcome,
    String deltaReason,
    CarryDecision carryDecision,
    String carryRationale,
    UUID nextCommitId,
    Instant reconciledAt) {}
