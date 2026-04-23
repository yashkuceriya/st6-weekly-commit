import type { WeeklyPlan } from '@st6/shared-types';
import { Button, SectionHeader, StatusBadge } from '@st6/shared-ui';
import { Link } from 'react-router-dom';
import { formatTimestamp, formatWeekRange } from '../lib/format';
import type { LockReadiness } from '../lib/lock-validation';

interface PlanHeaderProps {
  plan: WeeklyPlan;
  readiness: LockReadiness;
  onLock: () => void;
  locking?: boolean;
}

export function PlanHeader({ plan, readiness, onLock, locking }: PlanHeaderProps) {
  const isDraft = plan.state === 'DRAFT';
  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow={formatWeekRange(plan.weekStartDate)}
        title="Your week"
        subtitle="Three to five commits, each linked to a Supporting Outcome. Lock by Tuesday."
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={plan.state} />
            {isDraft && (
              <div className="flex flex-col items-end">
                <Button onClick={onLock} loading={locking} disabled={!readiness.canLock || locking}>
                  Lock the week
                </Button>
                {!readiness.canLock && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {readiness.emptyPlan
                      ? 'Add at least one commit before locking.'
                      : `${readiness.totalIssues} issue${readiness.totalIssues === 1 ? '' : 's'} to fix below.`}
                  </p>
                )}
              </div>
            )}
            {plan.state === 'LOCKED' && (
              <Link to="reconcile">
                <Button variant="secondary">Start reconciliation</Button>
              </Link>
            )}
            {plan.state === 'RECONCILING' && (
              <Link to="reconcile">
                <Button>Continue reconciliation</Button>
              </Link>
            )}
          </div>
        }
      />
      {plan.state !== 'DRAFT' && (
        <div className="flex items-center justify-between rounded-md border border-claude-200 bg-claude-50 px-4 py-3 text-sm text-claude-700">
          <span>
            <strong className="font-semibold">Locked at {formatTimestamp(plan.lockedAt)}</strong>
            {plan.reconciledAt && ` · Reconciled at ${formatTimestamp(plan.reconciledAt)}`}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-claude-500">
            v{plan.version}
          </span>
        </div>
      )}
    </div>
  );
}
