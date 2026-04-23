/// <reference types="cypress" />

beforeEach(() => {
  cy.intercept('GET', '/api/strategic-nodes/tree').as('getStrategicTree');
  cy.intercept('GET', '/api/chess-layers').as('getChessLayers');
});
