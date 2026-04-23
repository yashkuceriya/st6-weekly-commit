package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.AppUser;
import com.st6.weeklycommit.domain.ManagerReview;
import com.st6.weeklycommit.domain.enums.PlanState;
import com.st6.weeklycommit.domain.enums.ReviewStatus;
import com.st6.weeklycommit.domain.events.ReviewSubmittedEvent;
import com.st6.weeklycommit.repository.ManagerReviewRepository;
import com.st6.weeklycommit.repository.WeeklyPlanRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ManagerReviewService {

  private final WeeklyPlanRepository plans;
  private final ManagerReviewRepository reviews;
  private final ApplicationEventPublisher publisher;

  public ManagerReviewService(
      WeeklyPlanRepository plans,
      ManagerReviewRepository reviews,
      ApplicationEventPublisher publisher) {
    this.plans = plans;
    this.reviews = reviews;
    this.publisher = publisher;
  }

  @Transactional
  public ManagerReview submit(UUID planId, AppUser reviewer, ReviewStatus status, String summaryNote) {
    var plan = plans.findById(planId).orElseThrow(() -> new IllegalArgumentException("Plan not found"));
    if (plan.getState() != PlanState.RECONCILED) {
      throw new IllegalStateException("Can only review a RECONCILED plan, got " + plan.getState());
    }
    var managerOf = plan.getUser().getManager();
    if (managerOf == null || !managerOf.getId().equals(reviewer.getId())) {
      throw new SecurityException("Reviewer is not the plan owner's manager.");
    }

    var review = reviews.findByPlanId(planId).orElseGet(ManagerReview::new);
    review.setPlan(plan);
    review.setReviewer(reviewer);
    review.setReviewedAt(Instant.now());
    review.setStatus(status);
    review.setSummaryNote(summaryNote);
    var saved = reviews.save(review);
    publisher.publishEvent(
        new ReviewSubmittedEvent(planId, reviewer.getId(), status, saved.getReviewedAt()));
    return saved;
  }
}
