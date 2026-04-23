package com.st6.weeklycommit.web.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ActivityEntryDto(
    UUID id,
    UUID planId,
    UUID commitId,
    String eventType,
    String actor,
    Instant occurredAt,
    Map<String, Object> payload) {}
