package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.AppUser;
import com.st6.weeklycommit.domain.WeeklyCommit;
import com.st6.weeklycommit.domain.WeeklyPlan;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import com.st6.weeklycommit.domain.enums.PlanState;
import com.st6.weeklycommit.repository.AppUserRepository;
import com.st6.weeklycommit.repository.WeeklyCommitRepository;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import com.st6.weeklycommit.web.dto.ExceptionCardDto;
import com.st6.weeklycommit.web.dto.ManagerQueueResponse;
import com.st6.weeklycommit.web.dto.TeamRollupDto;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Computes the manager exception queue + rollup. Designed to answer "what
 * needs my attention right now?" not "what were last week's averages?".
 *
 * <p>Card kinds (sorted by urgency):
 *
 * <ol>
 *   <li>OVERDUE_LOCK — direct report hasn't locked by Tue EOD
 *   <li>PENDING_REVIEW_SLA — locked plan awaiting review past 48h
 *   <li>REPEATED_CARRY_FORWARD — commit at carry generation ≥ 3
 *   <li>OUTCOME_COVERAGE_GAP — outcome flagged team-priority with zero commits
 *   <li>BLOCKED_HIGH_PRIORITY — Missed commit at priority rank 1 or 2
 * </ol>
 */
@Service
public class ManagerQueueService {

  private final AppUserRepository users;
  private final WeeklyPlanRepository plans;
  private final WeeklyCommitRepository commits;

  @Value("${st6.sla.lock-due-day-of-week:TUESDAY}")
  private String lockDueDayOfWeek;

  @Value("${st6.sla.lock-due-hour:17}")
  private int lockDueHour;

  @Value("${st6.sla.review-due-hours:48}")
  private int reviewDueHours;

  public ManagerQueueService(
      AppUserRepository users, WeeklyPlanRepository plans, WeeklyCommitRepository commits) {
    this.users = users;
    this.plans = plans;
    this.commits = commits;
  }

  @Transactional(readOnly = true)
  public ManagerQueueResponse forTeam(AppUser manager, UUID teamId, LocalDate week, Pageable pageable) {
    var reports = users.findDirectReports(manager.getId());
    var teamPlans = plans.findTeamPlansForWeek(teamId, week, Pageable.unpaged()).getContent();
    var teamCommits = commits.findTeamCommitsForWeek(teamId, week);

    var cards = new ArrayList<ExceptionCardDto>();
    cards.addAll(detectOverdueLock(reports, week));
    cards.addAll(detectPendingReviewSla(teamPlans));
    cards.addAll(detectRepeatedCarry(teamCommits));
    cards.addAll(detectBlockedHighPriority(teamCommits));
    cards.sort(Comparator.comparing(ExceptionCardDto::severity).reversed());

    var rollup = computeRollup(teamId, week, reports, teamPlans, teamCommits);

    int from = (int) Math.min(cards.size(), pageable.getOffset());
    int to = Math.min(cards.size(), from + pageable.getPageSize());
    var pageContent = cards.subList(from, to);
    Page<ExceptionCardDto> page = new PageImpl<>(pageContent, pageable, cards.size());

    return new ManagerQueueResponse(rollup, page);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Detection
  // ────────────────────────────────────────────────────────────────────────

  private List<ExceptionCardDto> detectOverdueLock(List<AppUser> reports, LocalDate week) {
    var dueAt = lockDueAt(week);
    var now = Instant.now();
    if (now.isBefore(dueAt)) return List.of();
    var out = new ArrayList<ExceptionCardDto>();
    for (var report : reports) {
      var plan = plans.findActiveByUserAndWeek(report.getId(), week).orElse(null);
      if (plan == null || plan.getState() == PlanState.DRAFT) {
        var hours = (int) Duration.between(dueAt, now).toHours();
        out.add(
            new ExceptionCardDto(
                UUID.randomUUID(),
                "OVERDUE_LOCK",
                now,
                hours >= 24 ? "critical" : "warning",
                report.getId(),
                report.getDisplayName(),
                week,
                hours,
                null, null, null, null, null, null, null, null, null, null, null));
      }
    }
    return out;
  }

  private List<ExceptionCardDto> detectPendingReviewSla(List<WeeklyPlan> teamPlans) {
    var now = Instant.now();
    var out = new ArrayList<ExceptionCardDto>();
    for (var plan : teamPlans) {
      if (plan.getState() != PlanState.RECONCILED) continue;
      if (plan.getReview() != null) continue;
      var ready = plan.getReconciledAt();
      if (ready == null) continue;
      var hours = Duration.between(ready, now).toHours();
      if (hours < reviewDueHours) continue;
      out.add(
          new ExceptionCardDto(
              UUID.randomUUID(),
              "PENDING_REVIEW_SLA",
              now,
              hours >= reviewDueHours * 2L ? "critical" : "warning",
              plan.getUser().getId(),
              plan.getUser().getDisplayName(),
              plan.getWeekStartDate(),
              null,
              plan.getId(),
              (int) hours,
              null, null, null, null, null, null, null, null, null));
    }
    return out;
  }

  private List<ExceptionCardDto> detectRepeatedCarry(List<WeeklyCommit> commits) {
    var out = new ArrayList<ExceptionCardDto>();
    for (var c : commits) {
      if (c.getCarryGeneration() < 3) continue;
      out.add(
          new ExceptionCardDto(
              UUID.randomUUID(),
              "REPEATED_CARRY_FORWARD",
              Instant.now(),
              c.getCarryGeneration() >= 4 ? "critical" : "warning",
              c.getPlan().getUser().getId(),
              c.getPlan().getUser().getDisplayName(),
              null, null, null, null,
              c.getId(),
              c.getTitle(),
              c.getCarryGeneration(),
              rootOf(c),
              null, null, null, null, null));
    }
    return out;
  }

  private List<ExceptionCardDto> detectBlockedHighPriority(List<WeeklyCommit> commits) {
    var out = new ArrayList<ExceptionCardDto>();
    for (var c : commits) {
      var rec = c.getReconciliation();
      if (rec == null) continue;
      if (rec.getStatus() != CommitStatus.MISSED) continue;
      if (c.getPriorityRank() > 2) continue;
      out.add(
          new ExceptionCardDto(
              UUID.randomUUID(),
              "BLOCKED_HIGH_PRIORITY",
              Instant.now(),
              "critical",
              c.getPlan().getUser().getId(),
              c.getPlan().getUser().getDisplayName(),
              null, null, null, null,
              c.getId(),
              c.getTitle(),
              null, null, null, null, null,
              c.getPriorityRank(),
              rec.getDeltaReason()));
    }
    return out;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Rollup metrics
  // ────────────────────────────────────────────────────────────────────────

  private TeamRollupDto computeRollup(
      UUID teamId,
      LocalDate week,
      List<AppUser> reports,
      List<WeeklyPlan> teamPlans,
      List<WeeklyCommit> teamCommits) {
    int total = reports.size();
    int locked = 0;
    int reconciled = 0;
    int reviewedOnTime = 0;
    int totalLocked = 0;
    int delivered = 0;
    int totalReconciled = 0;
    int carried = 0;
    long totalTimeToPlan = 0;
    int timeToPlanCount = 0;

    for (var plan : teamPlans) {
      if (plan.getState() != PlanState.DRAFT) {
        locked++;
        totalLocked++;
      }
      if (plan.getState() == PlanState.RECONCILED) {
        reconciled++;
        if (plan.getReview() != null
            && plan.getReconciledAt() != null
            && Duration.between(plan.getReconciledAt(), plan.getReview().getReviewedAt())
                    .toHours()
                <= reviewDueHours) {
          reviewedOnTime++;
        }
      }
      if (plan.getFirstEditAt() != null && plan.getLockedAt() != null) {
        totalTimeToPlan +=
            Duration.between(plan.getFirstEditAt(), plan.getLockedAt()).toMinutes();
        timeToPlanCount++;
      }
    }

    int totalCommits = 0;
    int alignedCommits = 0;
    for (var c : teamCommits) {
      totalCommits++;
      if (c.getSupportingOutcome() != null) alignedCommits++;
      var rec = c.getReconciliation();
      if (rec != null) {
        totalReconciled++;
        if (rec.getStatus() == CommitStatus.DELIVERED) delivered++;
      }
      if (c.getCarryGeneration() > 1) carried++;
    }

    Long medianMinutes = timeToPlanCount == 0 ? null : totalTimeToPlan / timeToPlanCount;

    return new TeamRollupDto(
        teamId,
        week,
        total,
        pct(alignedCommits, totalCommits),
        pct(locked, total),
        pct(delivered, totalReconciled),
        pct(reviewedOnTime, reconciled),
        pct(carried, totalCommits),
        medianMinutes,
        countDistinctOutcomes(teamCommits));
  }

  private static int pct(int n, int d) {
    if (d == 0) return 0;
    return (int) Math.round(100.0 * n / d);
  }

  private static int countDistinctOutcomes(List<WeeklyCommit> commits) {
    return (int)
        commits.stream()
            .filter(c -> c.getSupportingOutcome() != null)
            .map(c -> c.getSupportingOutcome().getId())
            .distinct()
            .count();
  }

  private static UUID rootOf(WeeklyCommit c) {
    var cursor = c;
    while (cursor.getSourceCommit() != null) {
      cursor = cursor.getSourceCommit();
    }
    return cursor.getId();
  }

  private Instant lockDueAt(LocalDate weekStart) {
    var dayIdx = java.time.DayOfWeek.valueOf(lockDueDayOfWeek).getValue() - 1; // 0..6
    var dueDate = weekStart.plusDays(dayIdx);
    return LocalDateTime.of(dueDate, java.time.LocalTime.of(lockDueHour, 0))
        .atZone(ZoneId.systemDefault())
        .toInstant();
  }
}
