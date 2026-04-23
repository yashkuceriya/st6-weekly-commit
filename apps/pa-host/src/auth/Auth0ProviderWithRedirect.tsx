import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { setAuthTokenProvider } from '@st6/api-client';
import { useEffect, type PropsWithChildren } from 'react';

/**
 * Two layers:
 *
 *  1. `<Auth0Provider>` configures the SDK with tenant + audience.
 *     In dev (no env vars), we mount a noop provider that yields a fake JWT
 *     so the rest of the app works without an Auth0 tenant.
 *
 *  2. `<TokenBridge>` wires the Auth0 token getter into the api-client's
 *     module-scoped provider. The remote (which has no @auth0 dependency)
 *     reaches auth this way without prop-drilling.
 */
export function Auth0ProviderWithRedirect({ children }: PropsWithChildren) {
  const domain = import.meta.env['VITE_AUTH0_DOMAIN'];
  const clientId = import.meta.env['VITE_AUTH0_CLIENT_ID'];
  const audience = import.meta.env['VITE_AUTH0_AUDIENCE'];

  if (!domain || !clientId) {
    // Dev fallback: skip Auth0 entirely, mint a static dev token.
    setAuthTokenProvider(() => 'dev-bypass-token');
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
        scope: 'openid profile email plan:write plan:lock plan:reconcile manager:review',
      }}
      cacheLocation="localstorage"
    >
      <TokenBridge>{children}</TokenBridge>
    </Auth0Provider>
  );
}

function TokenBridge({ children }: PropsWithChildren) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    setAuthTokenProvider(async () => {
      if (!isAuthenticated) return null;
      try {
        return await getAccessTokenSilently();
      } catch {
        return null;
      }
    });
  }, [getAccessTokenSilently, isAuthenticated]);

  return <>{children}</>;
}
