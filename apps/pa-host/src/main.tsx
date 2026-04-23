import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Auth0ProviderWithRedirect } from './auth/Auth0ProviderWithRedirect';
import { store } from './store';
import { App } from './App';
import { initStaleChunkHandler } from './stale-chunk';
import '@st6/shared-ui/styles.css';

initStaleChunkHandler();

async function startApp() {
  // Start MSW mock API so the app works without a backend
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });

  const root = document.getElementById('root');
  if (!root) throw new Error('#root element missing from index.html');

  createRoot(root).render(
    <StrictMode>
      <Auth0ProviderWithRedirect>
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </Auth0ProviderWithRedirect>
    </StrictMode>,
  );
}

startApp();
