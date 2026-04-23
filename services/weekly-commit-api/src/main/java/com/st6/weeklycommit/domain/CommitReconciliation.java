package com.st6.weeklycommit.domain;

import com.st6.weeklycommit.domain.enums.CarryDecision;
import com.st6.weeklycommit.domain.enums.CommitStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "commit_reconciliation")
@Getter
@Setter
public class CommitReconciliation extends AbstractAuditingEntity {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "commit_id", nullable = false, unique = true)
  private WeeklyCommit commit;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "commit_status")
  private CommitStatus status;

  @Column(name = "actual_outcome", columnDefinition = "text")
  private String actualOutcome;

  @Column(name = "delta_reason", columnDefinition = "text")
  private String deltaReason;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "carry_decision", columnDefinition = "carry_decision")
  private CarryDecision carryDecision;

  @Column(name = "carry_rationale", columnDefinition = "text")
  private String carryRationale;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "next_commit_id")
  private WeeklyCommit nextCommit;

  @Column(name = "reconciled_at", nullable = false)
  private Instant reconciledAt = Instant.now();

  @Version
  @Column(nullable = false)
  private long version;
}
