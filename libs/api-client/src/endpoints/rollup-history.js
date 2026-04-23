import { weeklyCommitApi } from '../api';
const rollupHistoryApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        getRollupHistory: build.query({
            query: ({ teamId, endingWeek, weeks = 8 }) => ({
                url: `/teams/${teamId}/rollup/history`,
                params: { endingWeek, weeks },
            }),
            providesTags: (_r, _e, { teamId }) => [{ type: 'TeamRollup', id: teamId }],
        }),
    }),
    overrideExisting: false,
});
export const { useGetRollupHistoryQuery } = rollupHistoryApi;
//# sourceMappingURL=rollup-history.js.map