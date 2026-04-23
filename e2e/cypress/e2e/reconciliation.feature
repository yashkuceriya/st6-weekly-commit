Feature: Reconciliation discipline and carry-forward escalation
  As an IC
  I should explain plan-vs-actual deltas and decide what happens to incomplete work
  So that the weekly system encodes execution honesty rather than just tracking intent

  Background:
    Given I have a LOCKED plan with two commits
    And I open the reconciliation screen for that plan

  Scenario: Submission requires disposition + delta + decision for non-Delivered work
    When I mark commit 1 as Delivered with no other input
    And I mark commit 2 as Missed with no actual or delta
    Then the submit button stays disabled
    And I see field-level errors for actual outcome, delta reason, and carry decision

  Scenario: First-generation carry-forward accepts a brief rationale
    When I mark commit 2 as Partial with actual and delta filled in
    And I choose "Carry forward" as the decision
    And I write a short carry rationale
    Then the submit button becomes enabled

  Scenario: Second-generation carry-forward requires a longer rationale
    Given commit 2 has carry generation 1 from a previous week
    When I mark commit 2 as Partial with actual and delta filled in
    And I choose "Carry forward" as the decision
    And I write a 30-character rationale
    Then I see a warning "Need ≥ 60 chars"
    And the submit button stays disabled

  Scenario: Third-generation carry-forward triggers manager-ack flag on the child commit
    Given commit 2 has carry generation 2 from previous weeks
    When I reconcile and choose Carry forward with a 90-character rationale
    And I submit reconciliation
    Then a child commit appears in next week's DRAFT plan
    And the child commit has carry generation 3
    And the child commit has the requires_manager_ack flag set
