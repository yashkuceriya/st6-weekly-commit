import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { setAuthTokenProvider, weeklyCommitApi } from '@st6/api-client';
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

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-cream-50">
          <div className="border-b border-border bg-white px-6 py-3">
            <p className="font-mono text-xs uppercase tracking-wider text-claude-500">
              Standalone dev mode · weekly-commit-remote
            </p>
          </div>
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
            <WeeklyCommitApp basePath="" />
          </main>
        </div>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
