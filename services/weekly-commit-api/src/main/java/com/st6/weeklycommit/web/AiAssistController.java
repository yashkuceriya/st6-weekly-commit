package com.st6.weeklycommit.web;

import com.st6.weeklycommit.integration.AiAssistService;
import com.st6.weeklycommit.integration.AiAssistService.SuggestTitleInput;
import com.st6.weeklycommit.integration.AiAssistService.TitleSuggestion;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/commits")
@Tag(name = "AI assist", description = "Stable surface for AI-assisted authoring.")
public class AiAssistController {

  private final AiAssistService ai;

  public AiAssistController(AiAssistService ai) {
    this.ai = ai;
  }

  @PostMapping("/suggest-title")
  @PreAuthorize("hasAuthority('SCOPE_plan:write')")
  @Operation(summary = "Suggest a commit title from rationale + outcome context.")
  public TitleSuggestion suggestTitle(@RequestBody SuggestTitleInput body) {
    return ai.suggestTitle(body);
  }
}
