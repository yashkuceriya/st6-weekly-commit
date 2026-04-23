/**
 * Type declarations for federated remotes loaded at runtime.
 * Vite Module Federation produces these as side-effecting dynamic imports;
 * we declare the public contract here so TS strict mode doesn't choke.
 */
declare module 'weekly_commit/WeeklyCommitApp' {
  import type { ComponentType } from 'react';

  export interface WeeklyCommitAppProps {
    /** Optional base path under which the remote mounts its internal router. */
    basePath?: string;
  }

  const WeeklyCommitApp: ComponentType<WeeklyCommitAppProps>;
  export default WeeklyCommitApp;
}
