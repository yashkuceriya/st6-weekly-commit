import { weeklyCommitApi } from '../api';

export interface SuggestTitleInput {
  rationale?: string;
  outcomeTitle?: string;
}

export interface TitleSuggestion {
  title: string;
  source: string;
  note: string;
}

const aiApi = weeklyCommitApi.injectEndpoints({
  endpoints: (build) => ({
    suggestCommitTitle: build.mutation<TitleSuggestion, SuggestTitleInput>({
      query: (body) => ({
        url: '/commits/suggest-title',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useSuggestCommitTitleMutation } = aiApi;
