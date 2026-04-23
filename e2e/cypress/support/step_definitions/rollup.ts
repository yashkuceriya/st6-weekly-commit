/// <reference types="cypress" />
import { Then } from '@badeball/cypress-cucumber-preprocessor';

const rollupLabels = ['Aligned', 'Locked', 'Delivered', 'Review SLA', 'Carry-fwd', 'Time-to-plan'];

Then('I see the alignment percentage', () => {
  cy.contains('Aligned');
});
Then('I see the lock rate', () => {
  cy.contains('Locked');
});
Then('I see the review SLA met percentage', () => {
  cy.contains('Review SLA');
});
Then('I see the carry-forward rate', () => {
  cy.contains('Carry-fwd');
});
Then('I see the time-to-plan median', () => {
  cy.contains('Time-to-plan');
});

// Sanity check
rollupLabels.forEach((label) => {
  Then(`the rollup includes ${label}`, () => {
    cy.contains(label);
  });
});
