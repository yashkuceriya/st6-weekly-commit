package com.st6.weeklycommit.domain.events;

import com.st6.weeklycommit.domain.enums.ReviewStatus;
import java.time.Instant;
import java.util.UUID;

public record ReviewSubmittedEvent(
    UUID planId, UUID reviewerId, ReviewStatus status, Instant occurredAt) {}
