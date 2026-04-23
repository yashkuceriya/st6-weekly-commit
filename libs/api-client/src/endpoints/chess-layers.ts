import type { ChessLayerCategory } from '@st6/shared-types';
import { weeklyCommitApi } from '../api';

const chessLayersApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    getChessLayers: build.query<ChessLayerCategory[], void>({
      query: () => '/chess-layers',
      providesTags: [{ type: 'ChessLayers', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

export const { useGetChessLayersQuery } = chessLayersApi;
