package com.st6.weeklycommit.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Append-only audit trail. Never updated after creation. */
@Entity
@Table(name = "commit_event")
@Getter
@Setter
public class CommitEvent {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "plan_id")
  private WeeklyPlan plan;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "commit_id")
  private WeeklyCommit commit;

  @Column(name = "event_type", nullable = false, length = 64)
  private String eventType;

  @Column(nullable = false, length = 120)
  private String actor;

  @Column(columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  private Map<String, Object> payload;

  @Column(name = "occurred_at", nullable = false)
  private Instant occurredAt = Instant.now();
}
