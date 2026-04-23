import { weeklyCommitApi } from '../api';
const plansApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        getCurrentPlan: build.query({
            query: () => '/plans/me/current',
            providesTags: (result) => result ? [{ type: 'CurrentPlan', id: 'me' }, { type: 'Plan', id: result.id }] : [],
        }),
        getPlanById: build.query({
            query: (id) => `/plans/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Plan', id }],
        }),
        createPlan: build.mutation({
            query: (body) => ({ url: '/plans', method: 'POST', body }),
            invalidatesTags: [{ type: 'CurrentPlan', id: 'me' }],
        }),
        validateLock: build.query({
            query: (planId) => `/plans/${planId}/lock-preview`,
            providesTags: (_r, _e, planId) => [{ type: 'Plan', id: planId }],
        }),
        lockPlan: build.mutation({
            query: (planId) => ({ url: `/plans/${planId}/lock`, method: 'POST' }),
            invalidatesTags: (result, _e, planId) => [
                { type: 'Plan', id: planId },
                { type: 'CurrentPlan', id: 'me' },
                { type: 'TeamPlans', id: result?.userId ?? 'LIST' },
                { type: 'Exceptions', id: 'LIST' },
                { type: 'TeamRollup', id: 'LIST' },
            ],
        }),
        startReconciliation: build.mutation({
            query: (planId) => ({ url: `/plans/${planId}/start-reconciliation`, method: 'POST' }),
            invalidatesTags: (_r, _e, planId) => [{ type: 'Plan', id: planId }, { type: 'CurrentPlan', id: 'me' }],
        }),
        listTeamPlans: build.query({
            query: ({ teamId, weekStartDate, page = 0, size = 50 }) => ({
                url: `/teams/${teamId}/plans`,
                params: { weekStartDate, page, size },
            }),
            providesTags: (result, _e, { teamId }) => result
                ? [
                    ...result.content.map((p) => ({ type: 'Plan', id: p.id })),
                    { type: 'TeamPlans', id: teamId },
                ]
                : [{ type: 'TeamPlans', id: teamId }],
        }),
    }),
    overrideExisting: false,
});
export const { useGetCurrentPlanQuery, useGetPlanByIdQuery, useCreatePlanMutation, useValidateLockQuery, useLockPlanMutation, useStartReconciliationMutation, useListTeamPlansQuery, } = plansApi;
//# sourceMappingURL=plans.js.map