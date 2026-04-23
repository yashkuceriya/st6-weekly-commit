import type { WeeklyPlan } from '@st6/shared-types';
import { Button } from '@st6/shared-ui';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../lib/format';
import type { LockReadiness } from '../lib/lock-validation';
import { LifecycleBar } from './LifecycleBar';

interface PlanHeaderProps {
  plan: WeeklyPlan;
  readiness: LockReadiness;
  onLock: () => void;
  locking?: boolean;
}

function formatWeekTitle(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const fmtShort = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' });
  return `Week of ${fmtShort.format(start)} – ${fmt.format(end)}`;
}

export function PlanHeader({ plan, readiness, onLock, locking }: PlanHeaderProps) {
  const isDraft = plan.state === 'DRAFT';
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-[2rem] leading-tight tracking-tight text-ink">
            {formatWeekTitle(plan.weekStartDate)}
          </h1>
          <LifecycleBar current={plan.state} />
        </div>
        <div className="flex items-center gap-3">
          {isDraft && (
            <Button onClick={onLock} loading={locking} disabled={!readiness.canLock || locking}>
              Lock the week
            </Button>
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
      </div>
      <p className="text-sm italic text-ink-muted">
        {isDraft
          ? 'Lock your week by Monday 10am. Every commit must link to a Supporting Outcome.'
          : plan.reconciledAt
            ? `Reconciled at ${formatTimestamp(plan.reconciledAt)}`
            : `Locked at ${formatTimestamp(plan.lockedAt)}`}
      </p>
    </div>
  );
}
