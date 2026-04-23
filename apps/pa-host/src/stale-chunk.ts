/**
 * Federated CDN deployments can leave clients pointing at expired chunks after
 * a fresh deploy. Listen for Vite's preloadError and force a hard reload so
 * users don't see a broken UI on a stale route.
 */
export function initStaleChunkHandler(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('vite:preloadError', (event) => {
    // eslint-disable-next-line no-console
    console.warn('[ST6] Stale chunk detected — reloading.', event);
    window.location.reload();
  });
}
