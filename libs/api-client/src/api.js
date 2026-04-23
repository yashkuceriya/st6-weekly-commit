import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TAG_TYPES } from './tags';
let tokenProvider = () => null;
/**
 * Host app calls this once at startup with its Auth0 token getter so that the
 * remote (which has no Auth0 dependency) can reach into auth via RTK Query.
 */
export function setAuthTokenProvider(provider) {
    tokenProvider = provider;
}
const rawBaseQuery = fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: async (headers) => {
        const token = await tokenProvider();
        if (token)
            headers.set('Authorization', `Bearer ${token}`);
        headers.set('Accept', 'application/json');
        return headers;
    },
});
const baseQueryWithRetry = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    // 401 → consumer (host) should listen to onQueryStarted and re-auth.
    return result;
};
function getApiBaseUrl() {
    if (typeof window !== 'undefined') {
        const meta = window.__ST6_API_BASE_URL__;
        if (meta)
            return meta;
    }
    if (typeof process !== 'undefined' && process.env['VITE_API_BASE_URL']) {
        return process.env['VITE_API_BASE_URL'];
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
//# sourceMappingURL=api.js.map