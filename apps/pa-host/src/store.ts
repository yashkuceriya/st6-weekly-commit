import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { weeklyCommitApi } from '@st6/api-client';

export const store = configureStore({
  reducer: {
    [weeklyCommitApi.reducerPath]: weeklyCommitApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(weeklyCommitApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
