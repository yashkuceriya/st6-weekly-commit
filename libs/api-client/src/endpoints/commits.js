import { weeklyCommitApi } from '../api';
const commitsApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        addCommit: build.mutation({
            query: ({ planId, body }) => ({
                url: `/plans/${planId}/commits`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (_r, _e, { planId }) => [
                { type: 'Plan', id: planId },
                { type: 'CurrentPlan', id: 'me' },
            ],
        }),
        updateCommit: build.mutation({
            query: ({ commitId, body }) => ({
                url: `/commits/${commitId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result) => result ? [{ type: 'Plan', id: result.planId }, { type: 'CurrentPlan', id: 'me' }] : [],
        }),
        deleteCommit: build.mutation({
            query: ({ commitId }) => ({ url: `/commits/${commitId}`, method: 'DELETE' }),
            invalidatesTags: (_r, _e, { planId }) => [
                { type: 'Plan', id: planId },
                { type: 'CurrentPlan', id: 'me' },
            ],
        }),
        reconcilePlan: build.mutation({
            query: ({ planId, body }) => ({
                url: `/plans/${planId}/reconcile`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, _e, { planId }) => [
                { type: 'Plan', id: planId },
                { type: 'CurrentPlan', id: 'me' },
                { type: 'TeamPlans', id: result?.userId ?? 'LIST' },
                { type: 'Exceptions', id: 'LIST' },
                { type: 'TeamRollup', id: 'LIST' },
            ],
        }),
    }),
    overrideExisting: false,
});
export const { useAddCommitMutation, useUpdateCommitMutation, useDeleteCommitMutation, useReconcilePlanMutation, } = commitsApi;
//# sourceMappingURL=commits.js.map