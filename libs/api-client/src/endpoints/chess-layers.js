import { weeklyCommitApi } from '../api';
const chessLayersApi = weeklyCommitApi.injectEndpoints({
    endpoints: (build) => ({
        getChessLayers: build.query({
            query: () => '/chess-layers',
            providesTags: [{ type: 'ChessLayers', id: 'LIST' }],
            keepUnusedDataFor: 300,
        }),
    }),
    overrideExisting: false,
});
export const { useGetChessLayersQuery } = chessLayersApi;
//# sourceMappingURL=chess-layers.js.map