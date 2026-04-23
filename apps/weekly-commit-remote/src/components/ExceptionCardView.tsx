import type { ExceptionCard } from '@st6/shared-types';
import { Card, CardBody, cn } from '@st6/shared-ui';

interface ExceptionCardViewProps {
  card: ExceptionCard;
}

const severityStyles: Record<string, string> = {
  info: 'border-border bg-white',
  warning: 'border-warning/40 bg-warning-subtle/40',
  critical: 'border-danger/40 bg-danger-subtle/40',
};

export function ExceptionCardView({ card }: ExceptionCardViewProps) {
  return (
    <Card className={cn(severityStyles[card.severity] ?? severityStyles.info)}>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-subtle">
              {labelFor(card.type)}
            </p>
            <h3 className="font-serif text-base text-ink">{titleFor(card)}</h3>
          </div>
          <button
            type="button"
            className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-cream-100"
          >
            {actionLabelFor(card.type)}
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
