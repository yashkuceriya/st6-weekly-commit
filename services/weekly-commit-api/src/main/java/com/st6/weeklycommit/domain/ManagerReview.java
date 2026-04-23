package com.st6.weeklycommit.domain;

import com.st6.weeklycommit.domain.enums.ReviewStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "manager_review")
@Getter
@Setter
public class ManagerReview extends AbstractAuditingEntity {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "plan_id", nullable = false, unique = true)
  private WeeklyPlan plan;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "reviewer_id", nullable = false)
  private AppUser reviewer;

  @Column(name = "reviewed_at", nullable = false)
  private Instant reviewedAt = Instant.now();

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "review_status")
  private ReviewStatus status = ReviewStatus.PENDING;

  @Column(name = "summary_note", columnDefinition = "text")
  private String summaryNote;

  @Version
  @Column(nullable = false)
  private long version;
}
