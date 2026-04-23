package com.st6.weeklycommit.web;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Smoke endpoint used by the host to confirm the API is reachable through the
 * Vite dev proxy (`/api/health`). Spring Actuator's `/actuator/health` covers
 * liveness/readiness; this is just a frontend-friendly ping.
 */
@RestController
public class HealthController {

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of(
        "status", "OK",
        "service", "weekly-commit-api",
        "timestamp", Instant.now().toString());
  }
}
