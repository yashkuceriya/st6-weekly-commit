package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.CommitEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommitEventRepository extends JpaRepository<CommitEvent, UUID> {

  List<CommitEvent> findByPlanIdOrderByOccurredAtDesc(UUID planId);
}
