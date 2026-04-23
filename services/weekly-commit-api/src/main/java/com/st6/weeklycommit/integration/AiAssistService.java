package com.st6.weeklycommit.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * AI assist surface — currently a structured stub.
 *
 * <p>Real LLM integration is intentionally deferred for the take-home: the
 * second-research synthesis warned against making a demo depend on a fragile
 * AI call, and the brief lists no specific provider. The interface exists so
 * the FE can wire the "✨ Suggest" button against a stable contract.
 *
 * <p>When {@code st6.ai.enabled=true}, swap this with a real OpenAI / Bedrock
 * / Azure OpenAI call — the controller signature does not change.
 */
@Service
public class AiAssistService {

  @Value("${st6.ai.enabled:false}")
  private boolean enabled;

  public TitleSuggestion suggestTitle(SuggestTitleInput input) {
    if (!enabled) {
      return new TitleSuggestion(stubTitle(input), "stub", "Real LLM disabled in this profile.");
    }
    // Real implementation:
    //   1. compose prompt with: input.outcomePath, input.rationale, last 3 weeks of commits
    //   2. call provider with cap on tokens + temperature
    //   3. log call in ai_usage_log table
    return new TitleSuggestion(stubTitle(input), "stub", "Wired but provider not configured.");
  }

  private static String stubTitle(SuggestTitleInput input) {
    var seed = input.outcomeTitle() == null ? "Unblock the next step on" : "Make progress on";
    var who = input.outcomeTitle() == null ? "this initiative" : input.outcomeTitle();
    return seed + " " + who;
  }

  public record SuggestTitleInput(String rationale, String outcomeTitle) {}

  public record TitleSuggestion(String title, String source, String note) {}
}
