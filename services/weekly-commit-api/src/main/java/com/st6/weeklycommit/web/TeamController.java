package com.st6.weeklycommit.web;

import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import com.st6.weeklycommit.service.ManagerQueueService;
import com.st6.weeklycommit.web.dto.ManagerQueueResponse;
import com.st6.weeklycommit.web.dto.Mappers;
import com.st6.weeklycommit.web.dto.WeeklyPlanDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/teams")
@Tag(name = "Teams", description = "Manager rollups and exception queue.")
public class TeamController {

  private final WeeklyPlanRepository plans;
  private final ManagerQueueService queue;
  private final CurrentUserService currentUser;

  public TeamController(
      WeeklyPlanRepository plans, ManagerQueueService queue, CurrentUserService currentUser) {
    this.plans = plans;
    this.queue = queue;
    this.currentUser = currentUser;
  }

  @GetMapping("/{teamId}/plans")
  @PreAuthorize("hasAuthority('SCOPE_manager:review')")
  @Operation(summary = "Paged team plans for a week. Pageable up to 2000 records.")
  public Page<WeeklyPlanDto> teamPlans(
      @PathVariable UUID teamId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStartDate,
      @PageableDefault(size = 50) Pageable pageable) {
    return plans.findTeamPlansForWeek(teamId, weekStartDate, pageable).map(Mappers::toDto);
  }

  @GetMapping("/{teamId}/exceptions")
  @PreAuthorize("hasAuthority('SCOPE_manager:review')")
  @Operation(summary = "Manager exception queue + team-week rollup metrics.")
  public ManagerQueueResponse exceptions(
      @PathVariable UUID teamId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStartDate,
      @PageableDefault(size = 50) Pageable pageable) {
    var manager = currentUser.require();
    return queue.forTeam(manager, teamId, weekStartDate, pageable);
  }
}
