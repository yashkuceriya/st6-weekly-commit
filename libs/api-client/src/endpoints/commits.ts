import type {
  CreateCommitRequest,
  ReconcilePlanRequest,
  UpdateCommitRequest,
  WeeklyCommit,
  WeeklyPlan,
} from '@st6/shared-types';
import { weeklyCommitApi } from '../api';

const commitsApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    addCommit: build.mutation<WeeklyCommit, { planId: string; body: CreateCommitRequest }>({
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
    updateCommit: build.mutation<WeeklyCommit, { commitId: string; body: UpdateCommitRequest }>({
      query: ({ commitId, body }) => ({
        url: `/commits/${commitId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: 'Plan', id: result.planId }, { type: 'CurrentPlan', id: 'me' }] : [],
    }),
    deleteCommit: build.mutation<void, { commitId: string; planId: string }>({
      query: ({ commitId }) => ({ url: `/commits/${commitId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'CurrentPlan', id: 'me' },
      ],
    }),
    reconcilePlan: build.mutation<WeeklyPlan, { planId: string; body: ReconcilePlanRequest }>({
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

export const {
  useAddCommitMutation,
  useUpdateCommitMutation,
  useDeleteCommitMutation,
  useReconcilePlanMutation,
} = commitsApi;
