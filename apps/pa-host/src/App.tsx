import { lazy, Suspense } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { Spinner } from '@st6/shared-ui';
import { cn } from '@st6/shared-ui';

/**
 * Federated route entry — lazy-loaded so the remote bundle is fetched only
 * when the user actually navigates to /weekly-commit/*. This is what hits
 * the brief's sub-second initial render target on the host.
 */
const WeeklyCommitApp = lazy(() => import('weekly_commit/WeeklyCommitApp'));

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50 text-ink">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/weekly-commit/me" replace />} />
          <Route
            path="/weekly-commit/*"
            element={
              <Suspense fallback={<RouteLoading />}>
                <WeeklyCommitApp basePath="/weekly-commit" />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function TopNav() {
  return (
    <header className="border-b border-border bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-claude-400 font-serif text-base font-semibold text-white">
            P
          </div>
          <div>
            <p className="font-serif text-base leading-none text-ink">PA</p>
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-subtle">
              Strategic execution
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <NavTab to="/weekly-commit/me" label="My week" />
          <NavTab to="/weekly-commit/team" label="Team" />
        </nav>
      </div>
    </header>
  );
}

function NavTab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          isActive ? 'bg-cream-100 text-ink' : 'text-ink-soft hover:bg-cream-100 hover:text-ink',
        )
      }
    >
      {label}
    </NavLink>
  );
}

function RouteLoading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <h1 className="font-serif text-3xl text-ink">Not found</h1>
      <p className="mt-2 text-sm text-ink-muted">That route doesn't exist in the host.</p>
    </div>
  );
}
