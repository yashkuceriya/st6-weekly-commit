package com.st6.weeklycommit.web;

import com.st6.weeklycommit.service.ManagerReviewService;
import com.st6.weeklycommit.web.dto.Mappers;
import com.st6.weeklycommit.web.dto.ManagerReviewDto;
import com.st6.weeklycommit.web.dto.Requests;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/plans")
@Tag(name = "Reviews", description = "Manager review of reconciled plans.")
public class ReviewController {

  private final ManagerReviewService reviews;
  private final CurrentUserService currentUser;

  public ReviewController(ManagerReviewService reviews, CurrentUserService currentUser) {
    this.reviews = reviews;
    this.currentUser = currentUser;
  }

  @PostMapping("/{planId}/review")
  @PreAuthorize("hasAuthority('SCOPE_manager:review')")
  @Operation(summary = "Submit manager review for a reconciled plan.")
  public ManagerReviewDto submit(
      @PathVariable UUID planId, @RequestBody @Valid Requests.SubmitReviewRequest body) {
    var reviewer = currentUser.require();
    var review = reviews.submit(planId, reviewer, body.status(), body.summaryNote());
    return Mappers.toDto(review);
  }
}
