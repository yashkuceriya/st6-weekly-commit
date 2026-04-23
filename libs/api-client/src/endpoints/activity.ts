import { weeklyCommitApi } from '../api';

export interface ActivityEntry {
  id: string;
  planId: string | null;
  commitId: string | null;
  eventType: string;
  actor: string;
  occurredAt: string;
  payload: Record<string, unknown> | null;
}

const activityApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    getPlanActivity: build.query<ActivityEntry[], string>({
      query: (planId) => `/plans/${planId}/activity`,
      providesTags: (_r, _e, planId) => [{ type: 'Plan', id: planId }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPlanActivityQuery } = activityApi;
