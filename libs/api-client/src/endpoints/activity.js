import { weeklyCommitApi } from '../api';
const activityApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        getPlanActivity: build.query({
            query: (planId) => `/plans/${planId}/activity`,
            providesTags: (_r, _e, planId) => [{ type: 'Plan', id: planId }],
        }),
    }),
    overrideExisting: false,
});
export const { useGetPlanActivityQuery } = activityApi;
//# sourceMappingURL=activity.js.map