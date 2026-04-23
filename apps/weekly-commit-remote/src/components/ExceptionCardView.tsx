import { useState, useCallback } from 'react';
import type { ExceptionCard } from '@st6/shared-types';
import { Card, CardBody, cn } from '@st6/shared-ui';

interface ExceptionCardViewProps {
  card: ExceptionCard;
  onDismiss?: (id: string) => void;
  onNavigate?: (path: string) => void;
}

const severityStyles: Record<string, string> = {
  info: 'border-border bg-white',
  warning: 'border-warning/40 bg-warning-subtle/40',
  critical: 'border-danger/40 bg-danger-subtle/40',
};

export function ExceptionCardView({ card, onDismiss, onNavigate }: ExceptionCardViewProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleAction = useCallback(() => {
    const action = actionFor(card.type);
    if (action.navigate && onNavigate) {
      onNavigate(action.navigate);
      return;
    }
    // Dismiss actions: fade out then remove
    setDismissed(true);
    setTimeout(() => onDismiss?.(card.id), 600);
  }, [card.id, card.type, onDismiss, onNavigate]);

  return (
    <Card className={cn(
      'transition-all duration-500',
      severityStyles[card.severity] ?? severityStyles.info,
      dismissed && 'translate-x-4 scale-[0.97] opacity-0',
    )}>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
              card.severity === 'critical' ? 'bg-danger' : card.severity === 'warning' ? 'bg-warning' : 'bg-ink-muted',
            )}>
              {initials(card.reportUserDisplayName)}
            </div>
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-subtle">
                {labelFor(card.type)}
              </p>
              <h3 className="font-serif text-base text-ink">{titleFor(card)}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAction}
            disabled={dismissed}
            className="shrink-0 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-cream-100 hover:text-ink"
          >
            {actionFor(card.type).label}
          </button>
        </div>
        <p className="ml-12 text-sm text-ink-muted">{descriptionFor(card)}</p>
      </CardBody>
    </Card>
  );
}

function labelFor(type: string): string {
  return type.replaceAll('_', ' ').toLowerCase();
}

function titleFor(card: ExceptionCard): string {
  switch (card.type) {
    case 'OVERDUE_LOCK':
      return `${card.reportUserDisplayName} hasn't locked the week`;
    case 'PENDING_REVIEW_SLA':
      return `${card.reportUserDisplayName}'s plan is awaiting review`;
    case 'REPEATED_CARRY_FORWARD':
      return `"${card.commitTitle}" — carry generation ${card.carryGeneration}`;
    case 'OUTCOME_COVERAGE_GAP':
      return `Outcome "${card.outcomeTitle}" has zero commits`;
    case 'BLOCKED_HIGH_PRIORITY':
      return `${card.reportUserDisplayName} missed P${card.priorityRank}: "${card.commitTitle}"`;
  }
}

function descriptionFor(card: ExceptionCard): string {
  switch (card.type) {
    case 'OVERDUE_LOCK':
      return `${card.hoursOverdue}h past the lock deadline.`;
    case 'PENDING_REVIEW_SLA':
      return `${card.hoursPending}h past the 48h review SLA.`;
    case 'REPEATED_CARRY_FORWARD':
      return `Manager acknowledgement required from generation 3 onward.`;
    case 'OUTCOME_COVERAGE_GAP':
      return `${card.weeksUncovered} week(s) without team commits against this outcome.`;
    case 'BLOCKED_HIGH_PRIORITY':
      return `Delta: "${card.deltaReason}".`;
  }
}

function actionFor(type: string): { label: string; navigate?: string } {
  switch (type) {
    case 'OVERDUE_LOCK':
      return { label: 'Nudge' };
    case 'PENDING_REVIEW_SLA':
      return { label: 'Review', navigate: '/me' };
    case 'REPEATED_CARRY_FORWARD':
      return { label: 'Acknowledge' };
    case 'OUTCOME_COVERAGE_GAP':
      return { label: 'Acknowledge' };
    case 'BLOCKED_HIGH_PRIORITY':
      return { label: 'View', navigate: '/me' };
    default:
      return { label: 'Dismiss' };
  }
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
