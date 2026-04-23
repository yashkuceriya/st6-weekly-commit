package com.st6.weeklycommit.domain.events;

import java.time.Instant;
import java.util.UUID;

/** Published in the same transaction as the RECONCILE transition. */
public record PlanReconciledEvent(
    UUID planId, UUID userId, int carriedForwardCount, Instant occurredAt) {}
