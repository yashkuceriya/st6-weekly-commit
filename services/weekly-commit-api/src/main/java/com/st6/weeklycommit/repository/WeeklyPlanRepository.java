package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.WeeklyPlan;
import com.st6.weeklycommit.domain.enums.PlanState;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface WeeklyPlanRepository extends JpaRepository<WeeklyPlan, UUID> {

  @EntityGraph(
      attributePaths = {
        "user",
        "user.manager",
        "user.team",
        "commits",
        "commits.supportingOutcome",
        "commits.chessLayerCategory",
        "commits.reconciliation",
        "review",
        "review.reviewer"
      })
  Optional<WeeklyPlan> findWithCommitsById(UUID id);

  @Query(
      "SELECT p FROM WeeklyPlan p"
          + " WHERE p.user.id = :userId AND p.weekStartDate = :week AND p.deletedAt IS NULL")
  Optional<WeeklyPlan> findActiveByUserAndWeek(UUID userId, LocalDate week);

  @Query(
      "SELECT p FROM WeeklyPlan p"
          + " WHERE p.user.id = :userId AND p.deletedAt IS NULL ORDER BY p.weekStartDate DESC")
  List<WeeklyPlan> findRecentByUser(UUID userId, Pageable pageable);

  @Query(
      "SELECT p FROM WeeklyPlan p"
          + " WHERE p.user.team.id = :teamId AND p.weekStartDate = :week AND p.deletedAt IS NULL")
  Page<WeeklyPlan> findTeamPlansForWeek(UUID teamId, LocalDate week, Pageable pageable);

  long countByUserManagerIdAndWeekStartDateAndState(UUID managerId, LocalDate week, PlanState state);

  long countByUserManagerIdAndWeekStartDate(UUID managerId, LocalDate week);
}
