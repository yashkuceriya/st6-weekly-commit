package com.st6.weeklycommit.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "chess_layer_category")
@Getter
@Setter
public class ChessLayerCategory extends AbstractAuditingEntity {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(nullable = false, unique = true, length = 60)
  private String name;

  @Column(columnDefinition = "text")
  private String description;

  @Column(nullable = false, length = 7)
  private String color = "#D97757";

  @Column(name = "display_order", nullable = false)
  private int displayOrder;

  @Column(nullable = false, precision = 3, scale = 2)
  private BigDecimal weight = BigDecimal.ONE;

  @Column(name = "is_default", nullable = false)
  private boolean isDefault;

  @Column(nullable = false)
  private boolean active = true;

  @Version
  @Column(nullable = false)
  private long version;
}
