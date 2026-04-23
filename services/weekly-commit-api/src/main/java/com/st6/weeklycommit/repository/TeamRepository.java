package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.Team;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, UUID> {}
