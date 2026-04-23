import { useMemo, useState } from 'react';
import {
  useAddCommitMutation,
  useCreatePlanMutation,
  useDeleteCommitMutation,
  useGetChessLayersQuery,
  useGetCurrentPlanQuery,
  useGetPlanActivityQuery,
  useGetPlanHistoryQuery,
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
  const { data: planHistory } = useGetPlanHistoryQuery();
  const [addCommit] = useAddCommitMutation();
  const [updateCommit] = useUpdateCommitMutation();
  const [deleteCommit] = useDeleteCommitMutation();
  const [lockPlan, { isLoading: locking }] = useLockPlanMutation();
  const [createPlan] = useCreatePlanMutation();

  const [editing, setEditing] = useState<WeeklyCommit | null>(null);
  const [adding, setAdding] = useState(false);
  const [serverErrors, setServerErrors] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [chessFilter, setChessFilter] = useState<string | null>(null);

  const readiness = useMemo(() => (plan ? evaluateLockReadiness(plan) : null), [plan]);
  const pathsByOutcome = useMemo(() => buildPathIndex(tree ?? []), [tree]);

  const activeCommits = useMemo(() => plan?.commits.filter((c) => c.active) ?? [], [plan]);

  const filteredCommits = useMemo(() => {
    if (!chessFilter) return activeCommits;
    return activeCommits.filter((c) => c.chessLayerCategoryId === chessFilter);
  }, [activeCommits, chessFilter]);

  // Count commits per chess layer for filter tabs
  const chessFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of activeCommits) {
      if (c.chessLayerCategoryId) {
        counts[c.chessLayerCategoryId] = (counts[c.chessLayerCategoryId] ?? 0) + 1;
      }
    }
    return counts;
  }, [activeCommits]);

  // Chess layer distribution for summary bar — must be before early returns (Rules of Hooks)
  const chessDistribution = useMemo(() => {
    if (!chessLayers || activeCommits.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const c of activeCommits) {
      if (c.chessLayerCategoryId) counts[c.chessLayerCategoryId] = (counts[c.chessLayerCategoryId] ?? 0) + 1;
    }
    return chessLayers
      .filter((cl) => counts[cl.id])
      .map((cl) => ({ id: cl.id, name: cl.name, color: cl.color, count: counts[cl.id]! }));
  }, [activeCommits, chessLayers]);

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

  async function handleNewWeek() {
    const d = new Date();
    const day = d.getDay();
    const offset = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + offset);
    const nextMonday = d.toISOString().slice(0, 10);
    await createPlan({ weekStartDate: nextMonday }).unwrap();
  }

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

  const linkedCount = activeCommits.filter((c) => c.supportingOutcomeId).length;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ─── Left column: commits ─── */}
      <div className="space-y-6">
        <PlanHeader plan={plan} readiness={readiness} onLock={handleLock} onNewWeek={handleNewWeek} locking={locking} />

        {serverErrors && (
          <div className="rounded-md border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger">
            {serverErrors}
          </div>
        )}

        {/* Chess layer filter tabs */}
        {chessLayers && chessLayers.length > 0 && activeCommits.length > 0 && (
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-cream-50 p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={chessFilter === null}
              onClick={() => setChessFilter(null)}
              className={cn(
                'rounded-md px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider transition-colors',
                chessFilter === null
                  ? 'bg-white text-ink shadow-soft'
                  : 'text-ink-muted hover:text-ink-soft',
              )}
              style={chessFilter === null ? { borderBottom: '2px solid #D4603A' } : undefined}
            >
              All ({activeCommits.length})
            </button>
            {chessLayers.map((cl) => {
              const count = chessFilterCounts[cl.id] ?? 0;
              const isActive = chessFilter === cl.id;
              return (
                <button
                  key={cl.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setChessFilter(isActive ? null : cl.id)}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider transition-colors',
                    isActive
                      ? 'bg-white text-ink shadow-soft'
                      : 'text-ink-muted hover:text-ink-soft',
                  )}
                  style={isActive ? { borderBottom: `2px solid ${cl.color}` } : undefined}
                >
                  {cl.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {activeCommits.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            }
            title="First week on Weekly Commit?"
            description="Pick a Supporting Outcome from your team's Rally Cry to create your first commit. Everything else flows from there."
            action={
              isDraft ? <Button size="lg" onClick={() => setAdding(true)}>Pick a Supporting Outcome</Button> : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredCommits.map((commit, idx) => (
              <div
                key={commit.id}
                draggable={isDraft && !chessFilter}
                onDragStart={(e) => {
                  if (chessFilter) return;
                  setDragIndex(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (chessFilter) return;
                  e.preventDefault();
                  setDragOverIndex(idx);
                }}
                onDragLeave={() => setDragOverIndex((prev) => (prev === idx ? null : prev))}
                onDrop={() => { if (!chessFilter) handleDrop(idx); }}
                className={cn(
                  'transition-transform',
                  dragIndex === idx && 'opacity-40',
                  dragOverIndex === idx && dragIndex !== idx && 'ring-2 ring-claude-300 ring-offset-2',
                  isDraft && !chessFilter && 'cursor-move',
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
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border bg-cream-50/50 py-5 text-sm text-ink-subtle transition-all duration-200 hover:border-claude-300 hover:bg-claude-50/30 hover:text-ink-soft hover:shadow-soft"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="10" y1="4" x2="10" y2="16" />
                  <line x1="4" y1="10" x2="16" y2="10" />
                </svg>
                Add commit
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Right column: sidebar ─── */}
      <aside className="space-y-4">
        {/* This week summary */}
        <Card>
          <CardBody className="px-5 py-5">
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-ink-subtle">This week</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-serif text-[3rem] font-bold leading-none tracking-tight text-ink">{activeCommits.length}</span>
              <span className="text-sm font-medium text-ink-muted">Planned<br />Commits</span>
            </div>
            {/* Chess layer distribution bar */}
            {chessDistribution.length > 0 && (
              <>
                <div className="mt-4 flex h-2 overflow-hidden rounded-full">
                  {chessDistribution.map((d) => (
                    <div
                      key={d.id}
                      className="h-full"
                      style={{ width: `${(d.count / activeCommits.length) * 100}%`, backgroundColor: d.color }}
                    />
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  {chessDistribution.map((d) => (
                    <div key={d.id} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-muted">
                        {d.name} ({d.count})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-3 border-t border-border pt-3">
              <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-subtle">
                Coverage · {linkedCount} of {activeCommits.length} linked to RCDO
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Lock this week CTA */}
        {isDraft && (
          <Card className={cn(
            'border-2 transition-colors',
            readiness.canLock ? 'border-claude-300 bg-claude-50/30' : 'border-border',
          )}>
            <CardBody className="space-y-4 px-5 py-5">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  readiness.canLock ? 'bg-claude-400 text-white' : 'bg-cream-200 text-ink-subtle',
                )}>
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" />
                    <path d="M5 7V5a3 3 0 116 0v2" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-medium text-ink">Lock this week</h3>
              </div>
              {readiness.canLock ? (
                <div className="flex items-center gap-2 rounded-lg bg-success-subtle px-3.5 py-2.5 text-sm text-success">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                  </svg>
                  All commits validated — ready to lock
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-sm text-ink-muted">
                    <span className="font-semibold text-ink-soft">{readiness.totalIssues}</span> item{readiness.totalIssues === 1 ? '' : 's'} remaining before you can lock.
                  </p>
                  <div className="rounded-lg bg-cream-50 p-3 space-y-1.5">
                    {Object.entries(readiness.errorsByCommit).slice(0, 3).flatMap(([commitId, errs]) => {
                      const commit = activeCommits.find((c) => c.id === commitId);
                      return Object.keys(errs).map((field) => (
                        <p key={`${commitId}-${field}`} className="flex items-start gap-2 text-xs text-danger">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                          <span>{friendlyFieldName(field)} on &ldquo;{commit?.title?.slice(0, 30) ?? 'commit'}&rdquo;</span>
                        </p>
                      ));
                    })}
                  </div>
                </div>
              )}
              <Button
                size="lg"
                className="w-full text-base"
                onClick={handleLock}
                loading={locking}
                disabled={!readiness.canLock || locking}
                iconLeft={
                  <svg className="h-4.5 w-4.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" />
                    <path d="M5 7V5a3 3 0 116 0v2" />
                  </svg>
                }
              >
                Lock week
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Carry forward from last week */}
        {activeCommits.some((c) => c.carryGeneration > 0) && (
          <Card variant="soft">
            <CardBody>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-subtle">
                Carry forward from last week
              </p>
              <div className="mt-3 space-y-2">
                {activeCommits
                  .filter((c) => c.carryGeneration > 0)
                  .map((c) => (
                    <div key={c.id} className="flex items-start gap-2 rounded-md bg-cream-50 px-3 py-2">
                      <input type="checkbox" checked readOnly className="mt-1 rounded border-border" />
                      <div>
                        <p className="text-sm text-ink">{c.title}</p>
                        <p className="font-mono text-[0.6rem] text-ink-subtle">
                          Gen {c.carryGeneration} · from previous week
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Activity feed */}
        <Card variant="soft">
          <CardHeader>
            <h3 className="font-serif text-base text-ink">Activity</h3>
          </CardHeader>
          <CardBody>
            <ActivityFeed entries={mapActivity(activity)} />
          </CardBody>
        </Card>

        {/* Previous weeks */}
        {planHistory && planHistory.length > 0 && (
          <Card variant="soft">
            <CardHeader>
              <h3 className="font-serif text-base text-ink">Previous weeks</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {planHistory.map((entry) => (
                <div key={entry.id} className="rounded-md border border-border bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-subtle">
                      Week of {formatWeekDate(entry.weekStartDate)}
                    </p>
                    <span className="rounded-full bg-success-subtle px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-success">
                      {entry.state === 'RECONCILED' ? 'Reconciled' : entry.state.charAt(0) + entry.state.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {entry.commitCount} commit{entry.commitCount === 1 ? '' : 's'}
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {entry.commitTitles.slice(0, 3).map((title, i) => (
                      <p key={i} className="truncate text-xs text-ink-subtle">
                        {title}
                      </p>
                    ))}
                    {entry.commitTitles.length > 3 && (
                      <p className="text-xs text-ink-subtle">
                        +{entry.commitTitles.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </aside>

      {/* Modal */}
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 px-4 py-12 backdrop-blur-sm"
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

const FIELD_LABELS: Record<string, string> = {
  supportingOutcome: 'Missing Supporting Outcome',
  chessLayer: 'Missing chess layer',
  expectedEvidence: 'Missing expected evidence',
  priority: 'Missing priority',
};

function friendlyFieldName(field: string): string {
  return FIELD_LABELS[field] ?? `Missing ${field}`;
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
