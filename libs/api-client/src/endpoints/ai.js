import { weeklyCommitApi } from '../api';
const aiApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        suggestCommitTitle: build.mutation({
            query: (body) => ({
                url: '/commits/suggest-title',
                method: 'POST',
                body,
            }),
        }),
    }),
    overrideExisting: false,
});
export const { useSuggestCommitTitleMutation } = aiApi;
//# sourceMappingURL=ai.js.map