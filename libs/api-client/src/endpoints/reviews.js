import { weeklyCommitApi } from '../api';
const reviewsApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        submitReview: build.mutation({
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
//# sourceMappingURL=reviews.js.map