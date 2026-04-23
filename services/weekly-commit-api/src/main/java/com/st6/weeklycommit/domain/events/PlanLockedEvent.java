package com.st6.weeklycommit.domain.events;

import java.time.Instant;
import java.util.UUID;

/** Published in the same transaction as the LOCK transition. */
public record PlanLockedEvent(UUID planId, UUID userId, Instant occurredAt) {}
