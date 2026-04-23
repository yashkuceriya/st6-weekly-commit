package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.ManagerReview;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManagerReviewRepository extends JpaRepository<ManagerReview, UUID> {

  Optional<ManagerReview> findByPlanId(UUID planId);
}
