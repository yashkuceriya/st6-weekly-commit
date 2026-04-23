package com.st6.weeklycommit.web;

import com.st6.weeklycommit.service.CommitService;
import com.st6.weeklycommit.service.CommitService.AddCommitInput;
import com.st6.weeklycommit.web.dto.Mappers;
import com.st6.weeklycommit.web.dto.Requests;
import com.st6.weeklycommit.web.dto.WeeklyCommitDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Commits", description = "Add, update, and delete weekly commits while in DRAFT.")
public class CommitController {

  private final CommitService commits;

  public CommitController(CommitService commits) {
    this.commits = commits;
  }

  @PostMapping("/plans/{planId}/commits")
  @PreAuthorize("hasAuthority('SCOPE_plan:write')")
  @Operation(summary = "Add a commit to a DRAFT plan.")
  public ResponseEntity<WeeklyCommitDto> add(
      @PathVariable UUID planId, @RequestBody @Valid Requests.CreateCommitRequest body) {
    var saved =
        commits.add(
            planId,
            new AddCommitInput(
                body.title(),
                body.rationale(),
                body.expectedEvidence(),
                body.supportingOutcomeId(),
                body.chessLayerCategoryId(),
                body.priorityRank()));
    return ResponseEntity.status(201).body(Mappers.toDto(saved));
  }

  @PutMapping("/commits/{commitId}")
  @PreAuthorize("hasAuthority('SCOPE_plan:write')")
  @Operation(summary = "Update a commit. Optimistic-locked via version.")
  public WeeklyCommitDto update(
      @PathVariable UUID commitId, @RequestBody @Valid Requests.UpdateCommitRequest body) {
    var updated =
        commits.update(
            commitId,
            new AddCommitInput(
                body.title(),
                body.rationale(),
                body.expectedEvidence(),
                body.supportingOutcomeId(),
                body.chessLayerCategoryId(),
                body.priorityRank()),
            body.version());
    return Mappers.toDto(updated);
  }

  @DeleteMapping("/commits/{commitId}")
  @PreAuthorize("hasAuthority('SCOPE_plan:write')")
  @Operation(summary = "Soft-delete a commit (only allowed in DRAFT).")
  public ResponseEntity<Void> delete(@PathVariable UUID commitId) {
    commits.delete(commitId);
    return ResponseEntity.noContent().build();
  }
}
