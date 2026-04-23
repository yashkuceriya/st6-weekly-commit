import { weeklyCommitApi } from '../api';
const exceptionsApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        getTeamExceptions: build.query({
            query: ({ teamId, weekStartDate, page = 0, size = 50 }) => ({
                url: `/teams/${teamId}/exceptions`,
                params: { weekStartDate, page, size },
            }),
            providesTags: (_r, _e, { teamId }) => [
                { type: 'Exceptions', id: teamId },
                { type: 'TeamRollup', id: teamId },
            ],
        }),
    }),
    overrideExisting: false,
});
export const { useGetTeamExceptionsQuery } = exceptionsApi;
//# sourceMappingURL=exceptions.js.map