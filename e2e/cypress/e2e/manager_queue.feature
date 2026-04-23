Feature: Manager exception queue
  As a manager
  I should see actionable exception cards rather than a passive analytics dashboard
  So that my first action of the week is on the report who needs me right now

  Background:
    Given I am signed in as manager "morgan.chen@st6.local"
    And I open the team page for my Engineering team

  Scenario: Top of page shows the team rollup
    Then I see the alignment percentage
    And I see the lock rate
    And I see the review SLA met percentage
    And I see the carry-forward rate
    And I see the time-to-plan median

  Scenario: An overdue lock by a direct report appears as an exception card
    Given my direct report "Lin Park" has not locked her plan by the deadline
    Then I see an "Overdue lock" exception card for Lin Park
    And the card has a primary "Nudge" action button

  Scenario: A repeated carry-forward shows as a warning card with manager ack
    Given my direct report has a commit at carry generation 3
    Then I see a "Repeated carry-forward" exception card for that commit
    And the card has a primary "Acknowledge" action button
    And the card severity is at least warning

  Scenario: When all is well, I see an empty state instead of clutter
    Given every direct report has locked their plan and review SLAs are met
    Then I see "All clear." in the queue
    And no exception cards are rendered
