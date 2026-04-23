package com.st6.weeklycommit.domain;

import com.st6.weeklycommit.domain.enums.PlanState;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "weekly_plan")
@Getter
@Setter
public class WeeklyPlan extends AbstractAuditingEntity {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @Column(name = "week_start_date", nullable = false)
  private LocalDate weekStartDate;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "plan_state")
  private PlanState state = PlanState.DRAFT;

  @Column(name = "drafted_at", nullable = false)
  private Instant draftedAt = Instant.now();

  @Column(name = "first_edit_at")
  private Instant firstEditAt;

  @Column(name = "locked_at")
  private Instant lockedAt;

  @Column(name = "reconciliation_started_at")
  private Instant reconciliationStartedAt;

  @Column(name = "reconciled_at")
  private Instant reconciledAt;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @Version
  @Column(nullable = false)
  private long version;

  @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  @OrderBy("priorityRank ASC, createdAt ASC")
  private List<WeeklyCommit> commits = new ArrayList<>();

  @OneToOne(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  private ManagerReview review;

  /** Convenience for code that needs to ask "are we still mutable?". */
  public boolean isMutable() {
    return state == PlanState.DRAFT;
  }

  public Optional<ManagerReview> getReviewOptional() {
    return Optional.ofNullable(review);
  }

  public List<WeeklyCommit> activeCommits() {
    return commits.stream().filter(WeeklyCommit::isActive).toList();
  }
}
