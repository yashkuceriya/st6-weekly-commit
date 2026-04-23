import { cn } from '../utils/cn';

type Status =
  | 'DRAFT'
  | 'LOCKED'
  | 'RECONCILING'
  | 'RECONCILED'
  | 'DELIVERED'
  | 'PARTIAL'
  | 'MISSED'
  | 'PENDING_REVIEW'
  | 'REVIEWED';

const styles: Record<Status, string> = {
  DRAFT: 'bg-cream-100 text-ink-soft border-border',
  LOCKED: 'bg-claude-100 text-claude-700 border-claude-200',
  RECONCILING: 'bg-warning-subtle text-warning border-warning/30',
  RECONCILED: 'bg-success-subtle text-success border-success/30',
  DELIVERED: 'bg-success-subtle text-success border-success/30',
  PARTIAL: 'bg-warning-subtle text-warning border-warning/30',
  MISSED: 'bg-danger-subtle text-danger border-danger/30',
  PENDING_REVIEW: 'bg-cream-200 text-ink-soft border-border-strong',
  REVIEWED: 'bg-success-subtle text-success border-success/30',
};

const labels: Record<Status, string> = {
  DRAFT: 'Draft',
  LOCKED: 'Locked',
  RECONCILING: 'Reconciling',
  RECONCILED: 'Reconciled',
  DELIVERED: 'Delivered',
  PARTIAL: 'Partial',
  MISSED: 'Missed',
  PENDING_REVIEW: 'Pending review',
  REVIEWED: 'Reviewed',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status],
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'LOCKED' && 'bg-claude-500',
          status === 'RECONCILING' && 'bg-warning',
          (status === 'RECONCILED' || status === 'DELIVERED' || status === 'REVIEWED') &&
            'bg-success',
          status === 'DRAFT' && 'bg-ink-subtle',
          status === 'PARTIAL' && 'bg-warning',
          status === 'MISSED' && 'bg-danger',
          status === 'PENDING_REVIEW' && 'bg-ink-muted',
        )}
      />
      {labels[status]}
    </span>
  );
}
