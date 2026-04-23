/**
 * RTK Query cache tags. Mutations declare `invalidatesTags`; queries declare
 * `providesTags`. Keep this list small and meaningful — over-tagging causes
 * cache thrash, under-tagging causes stale UI.
 */
export const TAG_TYPES = [
    'Plan',
    'CurrentPlan',
    'TeamPlans',
    'Exceptions',
    'TeamRollup',
    'StrategicTree',
    'ChessLayers',
    'Review',
];
//# sourceMappingURL=tags.js.map