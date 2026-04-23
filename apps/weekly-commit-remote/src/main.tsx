import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, NavLink, useLocation } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { setAuthTokenProvider, weeklyCommitApi } from '@st6/api-client';
import { cn } from '@st6/shared-ui';
import WeeklyCommitApp from './WeeklyCommitApp';
import '@st6/shared-ui/styles.css';

/**
 * Standalone dev entry. Exists so the remote can be developed in isolation
 * (e.g. `yarn dev:remote`) without spinning the host. In production the host
 * loads `WeeklyCommitApp` directly via federation; main.tsx is not consumed.
 */

const store = configureStore({
  reducer: { [weeklyCommitApi.reducerPath]: weeklyCommitApi.reducer },
  middleware: (getDefault) => getDefault().concat(weeklyCommitApi.middleware),
});

setupListeners(store.dispatch);
setAuthTokenProvider(() => 'dev-bypass-token');

function Shell() {
  const location = useLocation();
  const isTeam = location.pathname.startsWith('/team');
  const isReconcile = location.pathname.includes('/reconcile');
  const isStrategy = location.pathname.startsWith('/strategy');

  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      {/* ─── Top nav ─── */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {/* Left: branding */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-claude-400">
              <span className="font-serif text-sm font-semibold text-white">P</span>
            </div>
            <div className="leading-none">
              <p className="font-serif text-sm font-semibold tracking-tight text-ink">PA</p>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-subtle">Strategic Execution</p>
            </div>
          </div>

          {/* Center: nav tabs */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/me"
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                !isTeam && !isReconcile && !isStrategy
                  ? 'bg-cream-100 text-ink'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              My week
            </NavLink>
            <NavLink
              to="/me/reconcile"
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                isReconcile
                  ? 'bg-cream-100 text-ink'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              Reconcile
            </NavLink>
            <NavLink
              to="/team"
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                isTeam
                  ? 'bg-cream-100 text-ink'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              Team
            </NavLink>
            <NavLink
              to="/strategy"
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                isStrategy
                  ? 'bg-cream-100 text-ink'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              Strategy
            </NavLink>
          </nav>

          {/* Right: avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-200">
            <span className="font-mono text-xs font-medium text-ink-soft">JC</span>
          </div>
        </div>
      </header>

      {/* ─── Main content ─── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <WeeklyCommitApp basePath="" />
      </main>
    </div>
  );
}

async function startApp() {
  // Start MSW mock API in dev/preview mode (no backend needed)
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });

  const root = document.getElementById('root');
  if (!root) throw new Error('#root missing');

  createRoot(root).render(
    <StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </Provider>
    </StrictMode>,
  );
}

startApp();
