package com.st6.weeklycommit.domain;

import com.st6.weeklycommit.domain.enums.AppRole;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "user_role")
@Getter
@Setter
public class UserRole {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "app_role")
  private AppRole role;

  @Column(name = "granted_at", nullable = false)
  private Instant grantedAt = Instant.now();

  @Column(name = "granted_by", nullable = false, length = 120)
  private String grantedBy = "system";

  @Column(name = "revoked_at")
  private Instant revokedAt;

  public boolean isActive() {
    return revokedAt == null;
  }
}
