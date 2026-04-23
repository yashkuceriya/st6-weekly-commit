import type { ManagerReview, SubmitReviewRequest } from '@st6/shared-types';
import { weeklyCommitApi } from '../api';

const reviewsApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    submitReview: build.mutation<ManagerReview, { planId: string; body: SubmitReviewRequest }>({
      query: ({ planId, body }) => ({
        url: `/plans/${planId}/review`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { planId }) => [
        { type: 'Plan', id: planId },
        { type: 'Review', id: planId },
        { type: 'TeamPlans', id: 'LIST' },
        { type: 'Exceptions', id: 'LIST' },
        { type: 'TeamRollup', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useSubmitReviewMutation } = reviewsApi;
