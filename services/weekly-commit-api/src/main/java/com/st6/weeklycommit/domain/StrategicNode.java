package com.st6.weeklycommit.domain;

import com.st6.weeklycommit.domain.enums.StrategicNodeType;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "strategic_node")
@Getter
@Setter
public class StrategicNode extends AbstractAuditingEntity {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "strategic_node_type")
  private StrategicNodeType type;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private StrategicNode parent;

  @Column(nullable = false, length = 240)
  private String title;

  @Column(columnDefinition = "text")
  private String description;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "owning_team_id")
  private Team owningTeam;

  @Column(nullable = false)
  private boolean active = true;

  @Column(name = "active_from", nullable = false)
  private LocalDate activeFrom = LocalDate.now();

  @Column(name = "active_until")
  private LocalDate activeUntil;

  @Column(name = "display_order", nullable = false)
  private int displayOrder;

  @Version
  @Column(nullable = false)
  private long version;
}
