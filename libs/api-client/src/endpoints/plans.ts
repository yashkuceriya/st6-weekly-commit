import type {
  CreatePlanRequest,
  LockValidationResult,
  Page,
  WeeklyPlan,
} from '@st6/shared-types';
import { weeklyCommitApi } from '../api';

const plansApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrentPlan: build.query<WeeklyPlan, void>({
      query: () => '/plans/me/current',
      providesTags: (result) =>
        result ? [{ type: 'CurrentPlan' as const, id: 'me' }, { type: 'Plan', id: result.id }] : [],
    }),
    getPlanById: build.query<WeeklyPlan, string>({
      query: (id) => `/plans/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Plan', id }],
    }),
    createPlan: build.mutation<WeeklyPlan, CreatePlanRequest>({
      query: (body) => ({ url: '/plans', method: 'POST', body }),
      invalidatesTags: [{ type: 'CurrentPlan', id: 'me' }],
    }),
    validateLock: build.query<LockValidationResult, string>({
      query: (planId) => `/plans/${planId}/lock-preview`,
      providesTags: (_r, _e, planId) => [{ type: 'Plan', id: planId }],
    }),
    lockPlan: build.mutation<WeeklyPlan, string>({
      query: (planId) => ({ url: `/plans/${planId}/lock`, method: 'POST' }),
      invalidatesTags: (result, _e, planId) => [
        { type: 'Plan', id: planId },
        { type: 'CurrentPlan', id: 'me' },
        { type: 'TeamPlans', id: result?.userId ?? 'LIST' },
        { type: 'Exceptions', id: 'LIST' },
        { type: 'TeamRollup', id: 'LIST' },
      ],
    }),
    startReconciliation: build.mutation<WeeklyPlan, string>({
      query: (planId) => ({ url: `/plans/${planId}/start-reconciliation`, method: 'POST' }),
      invalidatesTags: (_r, _e, planId) => [{ type: 'Plan', id: planId }, { type: 'CurrentPlan', id: 'me' }],
    }),
    listTeamPlans: build.query<
      Page<WeeklyPlan>,
      { teamId: string; weekStartDate: string; page?: number; size?: number }
    >({
      query: ({ teamId, weekStartDate, page = 0, size = 50 }) => ({
        url: `/teams/${teamId}/plans`,
        params: { weekStartDate, page, size },
      }),
      providesTags: (result, _e, { teamId }) =>
        result
          ? [
              ...result.content.map((p) => ({ type: 'Plan' as const, id: p.id })),
              { type: 'TeamPlans' as const, id: teamId },
            ]
          : [{ type: 'TeamPlans' as const, id: teamId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCurrentPlanQuery,
  useGetPlanByIdQuery,
  useCreatePlanMutation,
  useValidateLockQuery,
  useLockPlanMutation,
  useStartReconciliationMutation,
  useListTeamPlansQuery,
} = plansApi;
