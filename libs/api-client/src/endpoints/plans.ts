import type {
  CreatePlanRequest,
  LockValidationResult,
  Page,
  WeeklyPlan,
} from '@st6/shared-types';
import { weeklyCommitApi } from '../api';

export interface PlanHistoryEntry {
  id: string;
  weekStartDate: string;
  state: string;
  commitCount: number;
  commitTitles: string[];
  reconciledAt: string | null;
  lockedAt: string | null;
}

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
      invalidatesTags: [{ type: 'CurrentPlan', id: 'me' }, { type: 'CurrentPlan', id: 'history' }],
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
    getPlanHistory: build.query<PlanHistoryEntry[], void>({
      query: () => '/plans/history',
      providesTags: [{ type: 'CurrentPlan' as const, id: 'history' }],
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
  useGetPlanHistoryQuery,
  useValidateLockQuery,
  useLockPlanMutation,
  useStartReconciliationMutation,
  useListTeamPlansQuery,
} = plansApi;
