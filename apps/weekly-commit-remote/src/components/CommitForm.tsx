import { useState } from 'react';
import { useGetStrategicTreeQuery, useSuggestCommitTitleMutation } from '@st6/api-client';
import type { StrategicNodeWithChildren, WeeklyCommit } from '@st6/shared-types';
import { Button, Card, CardBody, CardFooter, CardHeader, FieldError } from '@st6/shared-ui';
import { ChessLayerPicker } from './ChessLayerPicker';
import { StrategicNodePicker } from './StrategicNodePicker';

interface CommitFormProps {
  initial?: Partial<WeeklyCommit>;
  onSubmit: (values: CommitFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}

export interface CommitFormValues {
  title: string;
  rationale: string;
  expectedEvidence: string;
  supportingOutcomeId: string | null;
  chessLayerCategoryId: string | null;
  priorityRank: number;
}

export function CommitForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Add commit',
}: CommitFormProps) {
  const [values, setValues] = useState<CommitFormValues>({
    title: initial?.title ?? '',
    rationale: initial?.rationale ?? '',
    expectedEvidence: initial?.expectedEvidence ?? '',
    supportingOutcomeId: initial?.supportingOutcomeId ?? null,
    chessLayerCategoryId: initial?.chessLayerCategoryId ?? null,
    priorityRank: initial?.priorityRank ?? 1,
  });
  const [titleErr, setTitleErr] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [suggestTitle, { isLoading: suggesting }] = useSuggestCommitTitleMutation();
  const { data: tree } = useGetStrategicTreeQuery();

  async function handleSuggest() {
    const outcomeTitle = findOutcomeTitle(tree ?? [], values.supportingOutcomeId);
    const result = await suggestTitle({
      rationale: values.rationale || undefined,
      outcomeTitle: outcomeTitle ?? undefined,
    }).unwrap();
    update('title', result.title);
  }

  function update<K extends keyof CommitFormValues>(key: K, val: CommitFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function findOutcomeTitle(roots: StrategicNodeWithChildren[], id: string | null): string | null {
    if (!id) return null;
    const stack = [...roots];
    while (stack.length > 0) {
      const node = stack.pop();
      if (!node) continue;
      if (node.id === id) return node.title;
      stack.push(...node.children);
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) {
      setTitleErr('Give the commit a short title.');
      return;
    }
    setTitleErr(undefined);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="font-serif text-lg text-ink">{initial?.id ? 'Edit commit' : 'New commit'}</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Strategic alignment and clear evidence are required to lock the week.
          </p>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardBody className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <label className="block text-sm font-medium text-ink">
                Title <span className="text-claude-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={suggesting}
                className="text-xs font-medium text-claude-500 transition-colors hover:text-claude-600 disabled:text-ink-subtle"
                title="AI suggest title from rationale + outcome (stub in dev)"
              >
                {suggesting ? 'Thinking…' : '✨ Suggest'}
              </button>
            </div>
            <input
              type="text"
              value={values.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Ship outbound campaign for fintech vertical"
              className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-ink-subtle focus:border-claude-400"
              autoFocus
            />
            <FieldError message={titleErr} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Why this matters</label>
            <textarea
              value={values.rationale}
              onChange={(e) => update('rationale', e.target.value)}
              placeholder="One sentence on why this is on your week."
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-ink-subtle focus:border-claude-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Expected evidence <span className="text-claude-500">*</span>
            </label>
            <textarea
              value={values.expectedEvidence}
              onChange={(e) => update('expectedEvidence', e.target.value)}
              placeholder="What will you point to on Friday to say this is done?"
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-ink-subtle focus:border-claude-400"
            />
          </div>

          <StrategicNodePicker
            value={values.supportingOutcomeId}
            onChange={(id) => update('supportingOutcomeId', id)}
          />

          <ChessLayerPicker
            value={values.chessLayerCategoryId}
            onChange={(id) => update('chessLayerCategoryId', id)}
          />

          <div>
            <label className="block text-sm font-medium text-ink">Priority rank</label>
            <select
              value={values.priorityRank}
              onChange={(e) => update('priorityRank', Number(e.target.value))}
              className="mt-1 w-32 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-claude-400"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} — {n === 1 ? 'critical' : n === 5 ? 'low' : 'normal'}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
        <CardFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
