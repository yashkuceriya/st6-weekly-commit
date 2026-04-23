import type { ExceptionCard, Page, TeamWeekRollup } from '@st6/shared-types';
import { weeklyCommitApi } from '../api';

interface ExceptionsResponse {
  rollup: TeamWeekRollup;
  exceptions: Page<ExceptionCard>;
}

const exceptionsApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    getTeamExceptions: build.query<
      ExceptionsResponse,
      { teamId: string; weekStartDate: string; page?: number; size?: number }
    >({
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
