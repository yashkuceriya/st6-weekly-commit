// Re-export the same handlers from the remote's mocks.
// When running federated, fetch() happens from the host origin,
// so MSW must be started here with the same routes.
export { handlers } from '../../../weekly-commit-remote/src/mocks/handlers';
