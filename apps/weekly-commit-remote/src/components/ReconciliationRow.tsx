import {
  CarryDecision,
  CommitStatus,
  type ChessLayerCategory,
  type WeeklyCommit,
} from '@st6/shared-types';
import {
  Breadcrumb,
  type BreadcrumbSegment,
  Card,
  CardBody,
  ChessChip,
  cn,
} from '@st6/shared-ui';
import type { ReconciliationDraft } from '../lib/reconciliation';
import { rationaleStrengthForCarry } from '../lib/reconciliation';

interface ReconciliationRowProps {
  commit: WeeklyCommit;
  chessLayer?: ChessLayerCategory;
  pathSegments?: BreadcrumbSegment[];
  draft: ReconciliationDraft;
  onChange: (next: ReconciliationDraft) => void;
}

export function ReconciliationRow({
  commit,
  chessLayer,
  pathSegments,
  draft,
  onChange,
}: ReconciliationRowProps) {
  const needsExplanation =
    draft.status && draft.status !== CommitStatus.DELIVERED;
  const showCarry = needsExplanation;
  const isCarry = draft.carryDecision === CarryDecision.CARRY_FORWARD;

  // The CHILD generation, used to scale rationale strength requirements.
  const nextGeneration = commit.carryGeneration + 1;
  const rationale = rationaleStrengthForCarry(nextGeneration, draft.carryRationale ?? '');

  return (
    <Card>
      <CardBody className="grid gap-6 md:grid-cols-2">
        {/* PLANNED column */}
        <div className="space-y-3 border-r border-border-subtle pr-6">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-subtle">Planned</p>
          <h3 className="font-serif text-lg text-ink">
            <span className="mr-2 font-mono text-xs text-ink-subtle">#{commit.priorityRank}</span>
            {commit.title}
          </h3>
          {commit.lockedOutcomePath ? (
            <div className="rounded-md bg-cream-50 px-3 py-2">
              <p className="text-xs text-ink-muted">{commit.lockedOutcomePath}</p>
            </div>
          ) : pathSegments ? (
            <div className="rounded-md bg-cream-50 px-3 py-2">
              <Breadcrumb segments={pathSegments} />
            </div>
          ) : null}
          <div className="space-y-1 text-sm text-ink-soft">
            {chessLayer && <ChessChip label={chessLayer.name} color={chessLayer.color} />}
            {commit.expectedEvidence && (
              <p className="text-xs text-ink-muted">
                <span className="font-medium text-ink-soft">Expected:</span>{' '}
                {commit.expectedEvidence}
              </p>
            )}
            {commit.rationale && <p className="text-xs italic text-ink-muted">"{commit.rationale}"</p>}
          </div>
        </div>

        {/* ACTUAL column */}
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-subtle">Actual</p>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Disposition</p>
            <div className="flex gap-2">
              {(['DELIVERED', 'PARTIAL', 'MISSED'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ ...draft, status: s, carryDecision: s === 'DELIVERED' ? null : draft.carryDecision })}
                  className={cn(
                    'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all',
                    draft.status === s
                      ? statusActive[s]
                      : 'border-border bg-white text-ink-soft hover:bg-cream-100',
                  )}
                >
                  {labelFor(s)}
                </button>
              ))}
            </div>
          </div>

          {needsExplanation && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink">
                  What actually happened? <span className="text-claude-500">*</span>
                </label>
                <textarea
                  value={draft.actualOutcome ?? ''}
                  onChange={(e) => onChange({ ...draft, actualOutcome: e.target.value })}
                  rows={2}
                  placeholder="Honest one-liner about the result."
                  className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-claude-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">
                  Why did it go that way? <span className="text-claude-500">*</span>
                </label>
                <textarea
                  value={draft.deltaReason ?? ''}
                  onChange={(e) => onChange({ ...draft, deltaReason: e.target.value })}
                  rows={2}
                  placeholder="Blocker, dependency, scope change, learning, …"
                  className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-claude-400"
                />
              </div>
            </>
          )}

          {showCarry && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink">What happens next?</p>
              <div className="flex gap-2">
                {(['DROP', 'FINISHED_NEXT_WEEK', 'CARRY_FORWARD'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onChange({ ...draft, carryDecision: d })}
                    className={cn(
                      'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all',
                      draft.carryDecision === d
                        ? 'border-claude-400 bg-claude-50 text-ink'
                        : 'border-border bg-white text-ink-soft hover:bg-cream-100',
                    )}
                  >
                    {carryLabel[d]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isCarry && (
            <div>
              <label className="block text-sm font-medium text-ink">
                Carry rationale{' '}
                {nextGeneration >= 2 && <span className="text-claude-500">* (longer)</span>}
              </label>
              <textarea
                value={draft.carryRationale ?? ''}
                onChange={(e) => onChange({ ...draft, carryRationale: e.target.value })}
                rows={nextGeneration >= 2 ? 4 : 2}
                placeholder={
                  nextGeneration >= 2
                    ? 'Why is this still on the plate? At least 60 chars — the system tracks repeated carries.'
                    : 'Why are we carrying this forward?'
                }
                className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-claude-400"
              />
              <p className={cn('mt-1 text-xs', rationale.ok ? 'text-success' : 'text-warning')}>
                {rationale.message}
              </p>
              {nextGeneration >= 3 && (
                <p className="mt-2 rounded-md bg-warning-subtle px-3 py-2 text-xs text-warning">
                  ⚠ This will be carry generation {nextGeneration} — manager acknowledgement will be required.
                </p>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

const statusActive: Record<'DELIVERED' | 'PARTIAL' | 'MISSED', string> = {
  DELIVERED: 'border-success bg-success-subtle text-success',
  PARTIAL: 'border-warning bg-warning-subtle text-warning',
  MISSED: 'border-danger bg-danger-subtle text-danger',
};

function labelFor(s: 'DELIVERED' | 'PARTIAL' | 'MISSED'): string {
  return s === 'DELIVERED' ? 'Delivered' : s === 'PARTIAL' ? 'Partial' : 'Missed';
}

const carryLabel: Record<'DROP' | 'FINISHED_NEXT_WEEK' | 'CARRY_FORWARD', string> = {
  DROP: 'Drop',
  FINISHED_NEXT_WEEK: 'Finish next week',
  CARRY_FORWARD: 'Carry forward',
};
