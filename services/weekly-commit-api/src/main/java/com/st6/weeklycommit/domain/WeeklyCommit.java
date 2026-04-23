package com.st6.weeklycommit.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "weekly_commit")
@Getter
@Setter
public class WeeklyCommit extends AbstractAuditingEntity {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "plan_id", nullable = false)
  private WeeklyPlan plan;

  @Column(nullable = false, length = 240)
  private String title;

  @Column(columnDefinition = "text")
  private String rationale;

  @Column(name = "expected_evidence", columnDefinition = "text")
  private String expectedEvidence;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "supporting_outcome_id")
  private StrategicNode supportingOutcome;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "chess_layer_category_id")
  private ChessLayerCategory chessLayerCategory;

  @Column(name = "priority_rank", nullable = false)
  private int priorityRank = 1;

  @Column(name = "locked_outcome_path", columnDefinition = "text")
  private String lockedOutcomePath;

  @Column(name = "locked_outcome_titles", columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  private Map<String, String> lockedOutcomeTitles;

  /**
   * Provenance: source commit if this row was created by a Carry Forward
   * action. The original "ancestor" commit chain can be walked by following
   * sourceCommit recursively.
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "source_commit_id")
  private WeeklyCommit sourceCommit;

  @Column(name = "carry_generation", nullable = false)
  private int carryGeneration = 1;

  @Column(name = "requires_manager_ack", nullable = false)
  private boolean requiresManagerAck;

  @Column(nullable = false)
  private boolean active = true;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @Version
  @Column(nullable = false)
  private long version;

  @OneToOne(mappedBy = "commit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  private CommitReconciliation reconciliation;

  /**
   * Lock-time validation contract — used by the LOCK guard in
   * {@link com.st6.weeklycommit.service.PlanLifecycleService}.
   *
   * <p>A commit is "lock-ready" iff every required field is present.
   * The actual error reporting (which fields are missing) is done by the
   * service so the client can render field-level errors per commit.
   */
  public boolean isLockReady() {
    return supportingOutcome != null
        && chessLayerCategory != null
        && priorityRank >= 1
        && expectedEvidence != null
        && !expectedEvidence.isBlank();
  }

  public Map<String, String> ensureLockedOutcomeTitles() {
    if (lockedOutcomeTitles == null) {
      lockedOutcomeTitles = new HashMap<>();
    }
    return lockedOutcomeTitles;
  }
}
