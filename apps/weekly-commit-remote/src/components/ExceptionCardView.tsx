import { useState, useCallback } from 'react';
import type { ExceptionCard } from '@st6/shared-types';
import { Card, CardBody, cn } from '@st6/shared-ui';

interface ExceptionCardViewProps {
  card: ExceptionCard;
  onDismiss?: (id: string) => void;
}

const severityStyles: Record<string, string> = {
  info: 'border-border bg-white',
  warning: 'border-warning/40 bg-warning-subtle/40',
  critical: 'border-danger/40 bg-danger-subtle/40',
};

function feedbackLabelFor(type: string): string {
  switch (type) {
    case 'OVERDUE_LOCK':
      return 'Sent!';
    case 'PENDING_REVIEW_SLA':
      return 'Opening...';
    case 'REPEATED_CARRY_FORWARD':
      return 'Done!';
    case 'OUTCOME_COVERAGE_GAP':
      return 'Opened!';
    case 'BLOCKED_HIGH_PRIORITY':
      return 'Opened!';
    default:
      return 'Done!';
  }
}

export function ExceptionCardView({ card, onDismiss }: ExceptionCardViewProps) {
  const [clicked, setClicked] = useState(false);

  const handleAction = useCallback(() => {
    setClicked(true);
    // Show feedback for 1.2s, THEN dismiss
    setTimeout(() => {
      onDismiss?.(card.id);
    }, 1200);
  }, [card.id, onDismiss]);

  return (
    <Card className={cn(
      'transition-all duration-500',
      severityStyles[card.severity] ?? severityStyles.info,
      clicked && 'scale-[0.98] opacity-60',
    )}>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
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
            disabled={clicked}
            className={cn(
              'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
              clicked
                ? 'border-success/40 bg-success-subtle text-success'
                : 'border-border bg-white text-ink-soft hover:bg-cream-100',
            )}
          >
            {clicked ? feedbackLabelFor(card.type) : actionLabelFor(card.type)}
          </button>
        </div>
        <p className="text-sm text-ink-muted">{descriptionFor(card)}</p>
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
      return `Manager acknowledgement required from generation 3 onward. Walk back the chain to the original commit.`;
    case 'OUTCOME_COVERAGE_GAP':
      return `${card.weeksUncovered} week(s) without team commits against this outcome.`;
    case 'BLOCKED_HIGH_PRIORITY':
      return `Delta reason: "${card.deltaReason}".`;
  }
}

function actionLabelFor(type: string): string {
  switch (type) {
    case 'OVERDUE_LOCK':
      return 'Nudge';
    case 'PENDING_REVIEW_SLA':
      return 'Review';
    case 'REPEATED_CARRY_FORWARD':
      return 'Acknowledge';
    case 'OUTCOME_COVERAGE_GAP':
      return 'Open outcome';
    case 'BLOCKED_HIGH_PRIORITY':
      return 'View';
    default:
      return 'Open';
  }
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
