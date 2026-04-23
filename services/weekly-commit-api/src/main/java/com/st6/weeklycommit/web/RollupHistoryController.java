package com.st6.weeklycommit.web;

import com.st6.weeklycommit.service.ManagerQueueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Rollup history powers the sparkline charts on the manager dashboard.
 * Returns a small fixed-window time series; lightweight enough to ship a
 * production-shaped contract without committing to a full analytics store.
 */
@RestController
@RequestMapping("/teams")
@Tag(name = "Teams", description = "Manager rollup history (sparklines).")
public class RollupHistoryController {

  private final ManagerQueueService queue;
  private final CurrentUserService currentUser;

  public RollupHistoryController(ManagerQueueService queue, CurrentUserService currentUser) {
    this.queue = queue;
    this.currentUser = currentUser;
  }

  public record HistoryPoint(LocalDate weekStartDate, int alignmentPercent, int lockRate, int reviewSlaPercent, int carryRate) {}

  @GetMapping("/{teamId}/rollup/history")
  @PreAuthorize("hasAuthority('SCOPE_manager:review')")
  @Operation(summary = "Last N weeks of team rollup metrics for trend visualisation.")
  public List<HistoryPoint> history(
      @PathVariable UUID teamId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endingWeek,
      @RequestParam(defaultValue = "8") int weeks) {
    var manager = currentUser.require();
    var out = new ArrayList<HistoryPoint>(weeks);
    for (int i = weeks - 1; i >= 0; i--) {
      var week = endingWeek.minusWeeks(i);
      var rollup =
          queue.forTeam(manager, teamId, week, org.springframework.data.domain.Pageable.unpaged())
              .rollup();
      out.add(
          new HistoryPoint(
              week,
              rollup.alignmentPercent(),
              rollup.planningCompletionPercent(),
              rollup.reviewSlaMetPercent(),
              rollup.carryForwardRate()));
    }
    return out;
  }
}
