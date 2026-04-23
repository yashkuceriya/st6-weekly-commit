Feature: Mandatory strategic alignment
  As an IC
  I should be unable to lock a week unless every commit maps to a Supporting Outcome
  So that strategic execution discipline is enforced at the unit of weekly intent

  Background:
    Given I am signed in as IC "dev-ic@st6.local"
    And I am on my weekly planner

  Scenario: Lock is blocked when any commit lacks a Supporting Outcome
    When I add a commit "Refresh decks" without picking a Supporting Outcome
    And I try to lock the week
    Then the lock is rejected with a 422 status
    And I see a field-level error "Pick a Supporting Outcome" on the unlinked commit
    And the plan remains in DRAFT state

  Scenario: Lock succeeds when every commit is fully linked
    When I add a commit "Ship outbound campaign" linked to outcome "Build outbound campaign for fintech vertical"
    And I add a commit "Lock-by-Tuesday nudge" linked to outcome "Lock-by-Tuesday nudge experiment"
    And every commit has a chess layer and expected evidence
    And I lock the week
    Then the plan moves to LOCKED state
    And every commit has a snapshotted breadcrumb path

  Scenario: Empty plans cannot be locked
    When I try to lock the week with no commits
    Then the lock is rejected
    And I see a hint asking me to add at least one commit
