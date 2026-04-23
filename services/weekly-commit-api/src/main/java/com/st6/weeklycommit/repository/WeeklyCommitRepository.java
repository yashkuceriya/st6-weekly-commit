package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.WeeklyCommit;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface WeeklyCommitRepository extends JpaRepository<WeeklyCommit, UUID> {

  @Query(
      "SELECT c FROM WeeklyCommit c"
          + " WHERE c.plan.user.team.id = :teamId AND c.plan.weekStartDate = :week"
          + "   AND c.active = true AND c.plan.deletedAt IS NULL"
          + " ORDER BY c.plan.user.displayName, c.priorityRank")
  List<WeeklyCommit> findTeamCommitsForWeek(UUID teamId, LocalDate week);

  @Query(
      "SELECT c FROM WeeklyCommit c"
          + " WHERE c.plan.user.manager.id = :managerId AND c.plan.weekStartDate = :week"
          + "   AND c.active = true AND c.plan.deletedAt IS NULL")
  List<WeeklyCommit> findReportsCommitsForWeek(UUID managerId, LocalDate week);

  /**
   * Walk the carry-forward provenance chain for a commit, returning all
   * ancestors in order (oldest first). Used by the carry-escalation rule and
   * the manager queue's repeated-carry exception card.
   */
  @Query(
      value =
          """
          WITH RECURSIVE chain(id, source_commit_id, depth, cycle_guard) AS (
              SELECT id, source_commit_id, 0, ARRAY[id]::uuid[]
                FROM weekly_commit WHERE id = :commitId
              UNION ALL
              SELECT wc.id, wc.source_commit_id, c.depth + 1,
                     c.cycle_guard || wc.id
                FROM weekly_commit wc
                JOIN chain c ON wc.id = c.source_commit_id
                WHERE NOT wc.id = ANY(c.cycle_guard)
          )
          SELECT id FROM chain ORDER BY depth DESC
          """,
      nativeQuery = true)
  List<UUID> findProvenanceChainIds(UUID commitId);
}
