import type { StrategicNodeWithChildren } from '@st6/shared-types';
import { weeklyCommitApi } from '../api';

const strategicNodesApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    getStrategicTree: build.query<StrategicNodeWithChildren[], void>({
      query: () => '/strategic-nodes/tree',
      providesTags: [{ type: 'StrategicTree', id: 'ROOT' }],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

export const { useGetStrategicTreeQuery } = strategicNodesApi;
