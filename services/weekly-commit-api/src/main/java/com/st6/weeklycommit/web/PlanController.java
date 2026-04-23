package com.st6.weeklycommit.web;

import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import com.st6.weeklycommit.service.PlanLifecycleService;
import com.st6.weeklycommit.service.PlanLifecycleService.ReconcileInput;
import com.st6.weeklycommit.web.dto.Mappers;
import com.st6.weeklycommit.web.dto.Requests;
import com.st6.weeklycommit.web.dto.WeeklyPlanDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/plans")
@Tag(name = "Plans", description = "Weekly plan lifecycle: create, lock, reconcile, review.")
public class PlanController {

  private final PlanLifecycleService lifecycle;
  private final WeeklyPlanRepository plans;
  private final CurrentUserService currentUser;

  public PlanController(
      PlanLifecycleService lifecycle, WeeklyPlanRepository plans, CurrentUserService currentUser) {
    this.lifecycle = lifecycle;
    this.plans = plans;
    this.currentUser = currentUser;
  }

  @GetMapping("/me/current")
  @Operation(summary = "Current user's plan for this week — creates DRAFT if missing.")
  public WeeklyPlanDto currentForMe() {
    var user = currentUser.require();
    var plan = lifecycle.createPlanForCurrentWeek(user);
    return Mappers.toDto(plans.findWithCommitsById(plan.getId()).orElseThrow());
  }

  @GetMapping("/{planId}")
  @Operation(summary = "Fetch a plan by id.")
  public WeeklyPlanDto byId(@PathVariable UUID planId) {
    return Mappers.toDto(
        plans
            .findWithCommitsById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId)));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('SCOPE_plan:write')")
  @Operation(summary = "Create (or fetch existing) plan for the given week.")
  public ResponseEntity<WeeklyPlanDto> create(@RequestBody @Valid Requests.CreatePlanRequest body) {
    var user = currentUser.require();
    var plan = lifecycle.createPlan(user, body.weekStartDate());
    var dto = Mappers.toDto(plans.findWithCommitsById(plan.getId()).orElseThrow());
    return ResponseEntity.status(201).body(dto);
  }

  @PostMapping("/{planId}/lock")
  @PreAuthorize("hasAuthority('SCOPE_plan:lock')")
  @Operation(summary = "Lock the plan — refuses with 422 if any commit is unaligned.")
  public WeeklyPlanDto lock(@PathVariable UUID planId) {
    var locked = lifecycle.lock(planId);
    return Mappers.toDto(plans.findWithCommitsById(locked.getId()).orElseThrow());
  }

  @PostMapping("/{planId}/start-reconciliation")
  @PreAuthorize("hasAuthority('SCOPE_plan:reconcile')")
  @Operation(summary = "Open the plan for reconciliation (LOCKED → RECONCILING).")
  public WeeklyPlanDto startReconciliation(@PathVariable UUID planId) {
    var p = lifecycle.startReconciliation(planId);
    return Mappers.toDto(plans.findWithCommitsById(p.getId()).orElseThrow());
  }

  @PostMapping("/{planId}/reconcile")
  @PreAuthorize("hasAuthority('SCOPE_plan:reconcile')")
  @Operation(summary = "Submit reconciliation; carry-forward decisions create child commits.")
  public WeeklyPlanDto reconcile(
      @PathVariable UUID planId, @RequestBody @Valid Requests.ReconcilePlanRequest body) {
    var inputs =
        body.reconciliations().stream()
            .map(
                r ->
                    new ReconcileInput(
                        r.commitId(),
                        r.status(),
                        r.actualOutcome(),
                        r.deltaReason(),
                        r.carryDecision(),
                        r.carryRationale()))
            .toList();
    var p = lifecycle.reconcile(planId, inputs);
    return Mappers.toDto(plans.findWithCommitsById(p.getId()).orElseThrow());
  }
}
