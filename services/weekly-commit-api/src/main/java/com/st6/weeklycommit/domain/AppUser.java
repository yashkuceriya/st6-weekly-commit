package com.st6.weeklycommit.domain;

import jakarta.persistence.*;
import java.util.UUID;

/**
 * Hand-written entity (not Lombok). The boolean {@code isManager} / {@code isAdmin}
 * fields collide with Lombok's @Getter naming when you use the {@code is} prefix
 * in the field name; explicit getters are clearer than fighting that convention.
 */
@Entity
@Table(name = "app_user")
public class AppUser extends AbstractAuditingEntity {

  @Id
  @GeneratedValue
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(nullable = false, unique = true, length = 160)
  private String email;

  @Column(name = "display_name", nullable = false, length = 160)
  private String displayName;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "manager_id")
  private AppUser manager;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "team_id")
  private Team team;

  @Column(name = "is_manager", nullable = false)
  private boolean isManager;

  @Column(name = "is_admin", nullable = false)
  private boolean isAdmin;

  @Column(nullable = false)
  private boolean active = true;

  // ────────────────────────────────────────────────────────────────────────
  // Getters / setters
  // ────────────────────────────────────────────────────────────────────────

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getDisplayName() {
    return displayName;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public AppUser getManager() {
    return manager;
  }

  public void setManager(AppUser manager) {
    this.manager = manager;
  }

  public Team getTeam() {
    return team;
  }

  public void setTeam(Team team) {
    this.team = team;
  }

  public boolean isManager() {
    return isManager;
  }

  public void setManager(boolean isManager) {
    this.isManager = isManager;
  }

  public boolean isAdmin() {
    return isAdmin;
  }

  public void setAdmin(boolean isAdmin) {
    this.isAdmin = isAdmin;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }
}
