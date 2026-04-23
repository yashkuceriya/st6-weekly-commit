package com.st6.weeklycommit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.io.Serializable;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * House-style auditing base. Every domain entity extends this so the JHipster
 * convention of {@code created_by / created_at / updated_by / updated_at}
 * audit columns is uniform across the schema.
 *
 * <p>The {@code @CreatedBy} / {@code @LastModifiedBy} fields are populated by
 * {@link com.st6.weeklycommit.config.AuditingConfig#auditorProvider()} which
 * pulls the principal name from {@link
 * org.springframework.security.core.context.SecurityContextHolder}.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class AbstractAuditingEntity implements Serializable {

  @CreatedBy
  @Column(name = "created_by", length = 120, nullable = false, updatable = false)
  private String createdBy;

  @CreatedDate
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @LastModifiedBy
  @Column(name = "updated_by", length = 120, nullable = false)
  private String updatedBy;

  @LastModifiedDate
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;
}
