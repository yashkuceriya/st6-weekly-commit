package com.st6.weeklycommit.web;

import com.st6.weeklycommit.service.ActivityFeedService;
import com.st6.weeklycommit.web.dto.ActivityEntryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/plans")
@Tag(name = "Activity", description = "Audit trail of state transitions and edits.")
public class ActivityController {

  private final ActivityFeedService feed;

  public ActivityController(ActivityFeedService feed) {
    this.feed = feed;
  }

  @GetMapping("/{planId}/activity")
  @Operation(summary = "Recent activity for a plan, newest first.")
  public List<ActivityEntryDto> activity(@PathVariable UUID planId) {
    return feed.recentForPlan(planId).stream()
        .map(
            e ->
                new ActivityEntryDto(
                    e.getId(),
                    e.getPlan() == null ? null : e.getPlan().getId(),
                    e.getCommit() == null ? null : e.getCommit().getId(),
                    e.getEventType(),
                    e.getActor(),
                    e.getOccurredAt(),
                    e.getPayload()))
        .toList();
  }
}
