import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetChessLayersQuery,
  useGetCurrentPlanQuery,
  useReconcilePlanMutation,
  useStartReconciliationMutation,
} from '@st6/api-client';
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  SectionHeader,
  Spinner,
  StatusBadge,
} from '@st6/shared-ui';
import { ReconciliationRow } from '../components/ReconciliationRow';
import { formatTimestamp, formatWeekRange } from '../lib/format';
import {
  emptyDraft,
  isReconciliationComplete,
  type ReconciliationDraft,
} from '../lib/reconciliation';

export function ReconciliationPage() {
  const navigate = useNavigate();
  const { data: plan, isLoading } = useGetCurrentPlanQuery();
  const { data: chessLayers } = useGetChessLayersQuery();
  const [startReconciliation, { isLoading: starting }] = useStartReconciliationMutation();
  const [reconcilePlan, { isLoading: submitting }] = useReconcilePlanMutation();

  const [drafts, setDrafts] = useState<Record<string, ReconciliationDraft>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const c of plan.commits) {
        if (!c.active) continue;
        if (!next[c.id]) {
          if (c.reconciliation) {
            next[c.id] = {
              commitId: c.id,
              status: c.reconciliation.status,
              actualOutcome: c.reconciliation.actualOutcome,
              deltaReason: c.reconciliation.deltaReason,
              carryDecision: c.reconciliation.carryDecision,
              carryRationale: c.reconciliation.carryRationale,
            };
          } else {
            next[c.id] = emptyDraft(c.id);
          }
        }
      }
      return next;
    });
  }, [plan]);

  const allComplete = useMemo(() => {
    if (!plan) return false;
    return plan.commits
      .filter((c) => c.active)
      .every((c) => isReconciliationComplete(drafts[c.id] ?? emptyDraft(c.id), c.carryGeneration + 1));
  }, [plan, drafts]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!plan) {
    return <EmptyState title="No plan to reconcile" />;
  }

  if (plan.state === 'DRAFT') {
    return (
      <div className="space-y-6">
        <SectionHeader title="Reconcile your week" eyebrow={formatWeekRange(plan.weekStartDate)} />
        <Card>
          <CardBody className="flex flex-col items-center space-y-5 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-claude-50">
              <svg className="h-7 w-7 text-claude-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="font-serif text-xl text-ink">Not quite time yet</p>
              <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
                Lock your plan first to commit to the week. Once locked, you can return here to reconcile what you delivered vs. what you planned.
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('..')}>
              Back to planner
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (plan.state === 'RECONCILED') {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow={formatWeekRange(plan.weekStartDate)}
          title="Reconciled"
          subtitle={`Submitted ${formatTimestamp(plan.reconciledAt)}.`}
          actions={<StatusBadge status="RECONCILED" />}
        />
        <Card>
          <CardBody className="space-y-3 text-sm text-ink-muted">
            <p>
              This week is closed. Carry-forward items have been seeded into next week's plan with
              full provenance.
            </p>
            <Button variant="secondary" onClick={() => navigate('..')}>
              Back to planner
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  async function handleStart() {
    if (!plan) return;
    setServerError(null);
    try {
      await startReconciliation(plan.id).unwrap();
    } catch (err: unknown) {
      const data = (err as { data?: { message?: string } })?.data;
      setServerError(data?.message ?? 'Could not start reconciliation.');
    }
  }

  async function handleSubmit() {
    if (!plan) return;
    setServerError(null);
    try {
      await reconcilePlan({
        planId: plan.id,
        body: {
          reconciliations: plan.commits
            .filter((c) => c.active)
            .map((c) => {
              const d = drafts[c.id] ?? emptyDraft(c.id);
              return {
                commitId: c.id,
                status: d.status!,
                ...(d.actualOutcome != null && { actualOutcome: d.actualOutcome }),
                ...(d.deltaReason != null && { deltaReason: d.deltaReason }),
                ...(d.carryDecision != null && { carryDecision: d.carryDecision }),
                ...(d.carryRationale != null && { carryRationale: d.carryRationale }),
              };
            }),
        },
      }).unwrap();
    } catch (err: unknown) {
      const data = (err as { data?: { message?: string } })?.data;
      setServerError(data?.message ?? 'Reconciliation failed.');
    }
  }

  const isLocked = plan.state === 'LOCKED';

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={formatWeekRange(plan.weekStartDate)}
        title={isLocked ? 'Ready to reconcile' : 'Reconcile your week'}
        subtitle={
          isLocked
            ? 'Open reconciliation to mark each commit as Delivered, Partial, or Missed.'
            : 'For each commit: planned vs actual, delta reason, and what happens next.'
        }
        actions={
          isLocked ? (
            <Button onClick={handleStart} loading={starting}>
              Start reconciliation
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting} disabled={!allComplete}>
              Submit reconciliation
            </Button>
          )
        }
      />

      {serverError && (
        <div className="rounded-md border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div className="space-y-3">
        {plan.commits
          .filter((c) => c.active)
          .map((commit) => (
            <ReconciliationRow
              key={commit.id}
              commit={commit}
              chessLayer={chessLayers?.find((c) => c.id === commit.chessLayerCategoryId)}
              draft={drafts[commit.id] ?? emptyDraft(commit.id)}
              onChange={(next) => setDrafts((prev) => ({ ...prev, [commit.id]: next }))}
            />
          ))}
      </div>

      {!isLocked && (
        <div className="flex items-center justify-between rounded-md border border-border bg-cream-50 px-4 py-3">
          <p className="text-sm text-ink-muted">
            {allComplete
              ? 'All commits accounted for — ready to submit.'
              : 'Fill in disposition + delta + decision for every commit to enable submit.'}
          </p>
          <Button onClick={handleSubmit} loading={submitting} disabled={!allComplete}>
            Submit reconciliation
          </Button>
        </div>
      )}
    </div>
  );
}
