package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.AppUser;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

  Optional<AppUser> findByEmail(String email);

  @Query(
      "SELECT u FROM AppUser u WHERE u.manager.id = :managerId AND u.active = true ORDER BY u.displayName")
  List<AppUser> findDirectReports(UUID managerId);
}
