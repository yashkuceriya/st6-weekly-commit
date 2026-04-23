package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.UserRole;
import com.st6.weeklycommit.domain.enums.AppRole;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

  @Query("SELECT ur.role FROM UserRole ur WHERE ur.user.id = :userId AND ur.revokedAt IS NULL")
  List<AppRole> findActiveRolesForUser(UUID userId);
}
