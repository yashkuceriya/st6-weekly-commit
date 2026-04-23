import { weeklyCommitApi } from '../api';
const strategicNodesApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        getStrategicTree: build.query({
            query: () => '/strategic-nodes/tree',
            providesTags: [{ type: 'StrategicTree', id: 'ROOT' }],
            keepUnusedDataFor: 300,
        }),
    }),
    overrideExisting: false,
});
export const { useGetStrategicTreeQuery } = strategicNodesApi;
//# sourceMappingURL=strategic-nodes.js.map