import { useMemo, useState } from 'react';
import {
  useAddCommitMutation,
  useDeleteCommitMutation,
  useGetChessLayersQuery,
  useGetCurrentPlanQuery,
  useGetPlanActivityQuery,
  useGetStrategicTreeQuery,
  useLockPlanMutation,
  useUpdateCommitMutation,
} from '@st6/api-client';
import type { StrategicNodeWithChildren, WeeklyCommit } from '@st6/shared-types';
import {
  ActivityFeed,
  type ActivityFeedEntry,
  Button,
  type BreadcrumbSegment,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Spinner,
  cn,
} from '@st6/shared-ui';
import { CommitCard } from '../components/CommitCard';
import { CommitForm, type CommitFormValues } from '../components/CommitForm';
import { PlanHeader } from '../components/PlanHeader';
import { evaluateLockReadiness } from '../lib/lock-validation';

export function PlannerPage() {
  const { data: plan, isLoading, error } = useGetCurrentPlanQuery();
  const { data: chessLayers } = useGetChessLayersQuery();
  const { data: tree } = useGetStrategicTreeQuery();
  const { data: activity } = useGetPlanActivityQuery(plan?.id ?? '', { skip: !plan?.id });
  const [addCommit] = useAddCommitMutation();
  const [updateCommit] = useUpdateCommitMutation();
  const [deleteCommit] = useDeleteCommitMutation();
  const [lockPlan, { isLoading: locking }] = useLockPlanMutation();

  const [editing, setEditing] = useState<WeeklyCommit | null>(null);
  const [adding, setAdding] = useState(false);
  const [serverErrors, setServerErrors] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const readiness = useMemo(() => (plan ? evaluateLockReadiness(plan) : null), [plan]);
  const pathsByOutcome = useMemo(() => buildPathIndex(tree ?? []), [tree]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (error || !plan || !readiness) {
    return (
      <EmptyState
        title="Couldn't load your plan"
        description="The API didn't respond. Check that the backend is running on :8080 and try again."
      />
    );
  }

  const isDraft = plan.state === 'DRAFT';
  const activeCommits = plan.commits.filter((c) => c.active);

  async function handleAdd(values: CommitFormValues) {
    if (!plan) return;
    await addCommit({ planId: plan.id, body: toCreateRequest(values) }).unwrap();
    setAdding(false);
  }

  async function handleUpdate(values: CommitFormValues) {
    if (!editing) return;
    await updateCommit({
      commitId: editing.id,
      body: { ...toCreateRequest(values), version: editing.version },
    }).unwrap();
    setEditing(null);
  }

  function toCreateRequest(values: CommitFormValues) {
    return {
      title: values.title,
      ...(values.rationale ? { rationale: values.rationale } : {}),
      ...(values.expectedEvidence ? { expectedEvidence: values.expectedEvidence } : {}),
      ...(values.supportingOutcomeId ? { supportingOutcomeId: values.supportingOutcomeId } : {}),
      ...(values.chessLayerCategoryId ? { chessLayerCategoryId: values.chessLayerCategoryId } : {}),
      priorityRank: values.priorityRank,
    };
  }

  async function handleDelete(commit: WeeklyCommit) {
    if (!confirm(`Delete "${commit.title}"?`)) return;
    await deleteCommit({ commitId: commit.id, planId: commit.planId }).unwrap();
  }

  async function handleLock() {
    if (!plan) return;
    setServerErrors(null);
    try {
      await lockPlan(plan.id).unwrap();
    } catch (err: unknown) {
      const data = (err as { data?: { message?: string } })?.data;
      setServerErrors(data?.message ?? 'Lock failed.');
    }
  }

  /**
   * Native HTML5 drag-to-reorder. On drop, we rebuild the priority order and
   * fire updateCommit for every commit whose rank changed. Sequential rather
   * than parallel because optimistic locking would fight us if N commits
   * shared a stale plan version. RTK Query invalidation refetches once.
   */
  async function handleDrop(targetIndex: number) {
    if (dragIndex == null || dragIndex === targetIndex || !isDraft) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...activeCommits];
    const [moved] = reordered.splice(dragIndex, 1);
    if (!moved) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    reordered.splice(targetIndex, 0, moved);

    for (let i = 0; i < reordered.length; i++) {
      const c = reordered[i];
      if (!c) continue;
      const newRank = i + 1;
      if (c.priorityRank === newRank) continue;
      // eslint-disable-next-line no-await-in-loop
      await updateCommit({
        commitId: c.id,
        body: {
          title: c.title,
          rationale: c.rationale ?? undefined,
          expectedEvidence: c.expectedEvidence ?? undefined,
          supportingOutcomeId: c.supportingOutcomeId ?? undefined,
          chessLayerCategoryId: c.chessLayerCategoryId ?? undefined,
          priorityRank: newRank,
          version: c.version,
        },
      }).unwrap();
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <PlanHeader plan={plan} readiness={readiness} onLock={handleLock} locking={locking} />

        {serverErrors && (
          <div className="rounded-md border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger">
            {serverErrors}
          </div>
        )}

        {activeCommits.length === 0 ? (
          <EmptyState
            title="Plan your week"
            description="Add three to five commits. Each one needs a Supporting Outcome — that's how every weekly bet ties back to strategy."
            action={
              isDraft ? <Button onClick={() => setAdding(true)}>Add your first commit</Button> : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {activeCommits.map((commit, idx) => (
              <div
                key={commit.id}
                draggable={isDraft}
                onDragStart={(e) => {
                  setDragIndex(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(idx);
                }}
                onDragLeave={() => setDragOverIndex((prev) => (prev === idx ? null : prev))}
                onDrop={() => handleDrop(idx)}
                className={cn(
                  'transition-transform',
                  dragIndex === idx && 'opacity-40',
                  dragOverIndex === idx && dragIndex !== idx && 'ring-2 ring-claude-300 ring-offset-2',
                  isDraft && 'cursor-move',
                )}
              >
                <CommitCard
                  commit={commit}
                  chessLayer={chessLayers?.find((c) => c.id === commit.chessLayerCategoryId)}
                  pathSegments={
                    commit.supportingOutcomeId ? pathsByOutcome.get(commit.supportingOutcomeId) : undefined
                  }
                  errors={readiness.errorsByCommit[commit.id]}
                  locked={!isDraft}
                  onEdit={() => setEditing(commit)}
                  onDelete={() => handleDelete(commit)}
                />
              </div>
            ))}
            {isDraft && (
              <div className="flex justify-center">
                <Button variant="ghost" onClick={() => setAdding(true)}>
                  + Add commit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Card variant="soft">
          <CardHeader>
            <h3 className="font-serif text-base text-ink">Activity</h3>
          </CardHeader>
          <CardBody>
            <ActivityFeed entries={mapActivity(activity)} />
          </CardBody>
        </Card>
        {isDraft && activeCommits.length > 0 && (
          <Card variant="soft">
            <CardBody className="text-xs text-ink-muted">
              <p className="mb-2 font-medium text-ink-soft">Tip</p>
              <p>Drag commits to reorder priority — rank 1 is most important.</p>
            </CardBody>
          </Card>
        )}
      </aside>

      {(adding || editing) && (
        <Modal onClose={() => (adding ? setAdding(false) : setEditing(null))}>
          <CommitForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleAdd}
            onCancel={() => (adding ? setAdding(false) : setEditing(null))}
            submitLabel={editing ? 'Save changes' : 'Add commit'}
          />
        </Modal>
      )}
    </div>
  );
}

function mapActivity(entries: { id: string; eventType: string; actor: string; occurredAt: string }[] | undefined): ActivityFeedEntry[] {
  if (!entries) return [];
  return entries.slice(0, 10).map((e) => ({
    id: e.id,
    eventType: e.eventType,
    actor: e.actor,
    occurredAt: e.occurredAt,
  }));
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4 py-8"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function buildPathIndex(roots: StrategicNodeWithChildren[]): Map<string, BreadcrumbSegment[]> {
  const out = new Map<string, BreadcrumbSegment[]>();
  function walk(node: StrategicNodeWithChildren, trail: BreadcrumbSegment[]) {
    const segs: BreadcrumbSegment[] = [
      ...trail,
      { id: node.id, label: node.title, type: node.type },
    ];
    if (node.type === 'SUPPORTING_OUTCOME') {
      out.set(node.id, segs);
    }
    for (const c of node.children) walk(c, segs);
  }
  for (const r of roots) walk(r, []);
  return out;
}
