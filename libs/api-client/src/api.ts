import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { TAG_TYPES } from './tags';

export type AuthTokenProvider = () => Promise<string | null> | string | null;

let tokenProvider: AuthTokenProvider = () => null;

/**
 * Host app calls this once at startup with its Auth0 token getter so that the
 * remote (which has no Auth0 dependency) can reach into auth via RTK Query.
 */
export function setAuthTokenProvider(provider: AuthTokenProvider): void {
  tokenProvider = provider;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: async (headers) => {
    const token = await tokenProvider();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithRetry: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  // 401 → consumer (host) should listen to onQueryStarted and re-auth.
  return result;
};

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const meta = (window as unknown as { __ST6_API_BASE_URL__?: string }).__ST6_API_BASE_URL__;
    if (meta) return meta;
  }
  if (typeof process !== 'undefined' && process.env['VITE_API_BASE_URL']) {
    return process.env['VITE_API_BASE_URL'] as string;
  }
  return '/api';
}

/**
 * Empty base API. Endpoints are split into separate modules and injected via
 * `.injectEndpoints()` to keep bundles tree-shakeable and to mirror the slice
 * pattern recommended in the RTK Query docs for large APIs.
 */
export const weeklyCommitApi = createApi({
  reducerPath: 'weeklyCommitApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: [...TAG_TYPES],
  endpoints: () => ({}),
  refetchOnFocus: true,
  refetchOnReconnect: true,
});
