import { weeklyCommitApi } from '../api';

export interface RollupHistoryPoint {
  weekStartDate: string;
  alignmentPercent: number;
  lockRate: number;
  reviewSlaPercent: number;
  carryRate: number;
}

const rollupHistoryApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    getRollupHistory: build.query<
      RollupHistoryPoint[],
      { teamId: string; endingWeek: string; weeks?: number }
    >({
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
