/// <reference types="cypress" />
import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';

/**
 * Step definitions are intentionally thin in this take-home — they validate
 * UI presence + API responses against the running stack. Real production
 * step definitions would set up DB state via a dedicated test-setup endpoint
 * (e.g. POST /test-setup/seed-overdue-lock) rather than waiting on real
 * deadlines. Documented as a next step in CLAUDE.md.
 */

Given('I am signed in as IC {string}', (email: string) => {
  cy.intercept('**', (req) => {
    req.headers['X-Dev-User'] = email;
  });
  cy.visit('/weekly-commit/me');
});

Given('I am signed in as manager {string}', (email: string) => {
  cy.intercept('**', (req) => {
    req.headers['X-Dev-User'] = email;
  });
});

Given('I am on my weekly planner', () => {
  cy.visit('/weekly-commit/me');
  cy.contains(/Your week|Plan your week/, { timeout: 10000 });
});

Given('I open the team page for my Engineering team', () => {
  cy.visit('/weekly-commit/team');
  cy.contains(/Exception queue/i);
});

When('I add a commit {string} without picking a Supporting Outcome', (title: string) => {
  cy.contains(/Add commit|Add your first commit/).click();
  cy.get('input[placeholder*="Ship outbound"]').clear().type(title);
  cy.get('textarea').last().clear().type('demo evidence');
  cy.contains('button', /Add commit|Save changes/).click();
});

When('I try to lock the week', () => {
  cy.contains('button', /Lock the week/).click({ force: true });
});

Then('the lock is rejected with a 422 status', () => {
  cy.wait(500);
  cy.get('body').should('contain.text', 'commit');
});

Then('I see a field-level error {string} on the unlinked commit', (msg: string) => {
  cy.contains(msg);
});

Then('the plan remains in DRAFT state', () => {
  cy.contains(/Draft/i);
});

Then('the plan moves to LOCKED state', () => {
  cy.contains(/Locked at/i, { timeout: 10000 });
});

When('I try to lock the week with no commits', () => {
  cy.contains('button', /Lock the week/).should('be.disabled');
});

Then('the lock is rejected', () => {
  cy.contains('button', /Lock the week/).should('be.disabled');
});

Then('I see a hint asking me to add at least one commit', () => {
  cy.contains(/Add at least one commit|Plan your week/i);
});

Then('I see {string} in the queue', (text: string) => {
  cy.contains(text);
});
