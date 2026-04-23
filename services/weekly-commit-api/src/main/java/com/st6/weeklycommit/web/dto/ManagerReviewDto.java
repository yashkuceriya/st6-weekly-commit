package com.st6.weeklycommit.web.dto;

import com.st6.weeklycommit.domain.enums.ReviewStatus;
import java.time.Instant;
import java.util.UUID;

public record ManagerReviewDto(
    UUID id,
    UUID planId,
    UUID reviewerId,
    String reviewerDisplayName,
    Instant reviewedAt,
    ReviewStatus status,
    String summaryNote) {}
