import { cn } from '../utils/cn';

export interface ActivityFeedEntry {
  id: string;
  eventType: string;
  actor: string;
  occurredAt: string;
  summary?: string;
}

interface ActivityFeedProps {
  entries: ActivityFeedEntry[];
  className?: string;
}

const eventGlyph: Record<string, { color: string; label: string }> = {
  PLAN_LOCKED: { color: 'bg-claude-400', label: 'Locked' },
  PLAN_RECONCILED: { color: 'bg-success', label: 'Reconciled' },
  REVIEW_SUBMITTED: { color: 'bg-claude-500', label: 'Reviewed' },
  COMMIT_ADDED: { color: 'bg-cream-400', label: 'Commit added' },
  COMMIT_EDITED: { color: 'bg-cream-300', label: 'Commit edited' },
  COMMIT_DELETED: { color: 'bg-danger', label: 'Commit removed' },
};

export function ActivityFeed({ entries, className }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <p className={cn('rounded-md border border-border-subtle bg-cream-50 px-3 py-4 text-xs text-ink-muted', className)}>
        No activity yet.
      </p>
    );
  }
  return (
    <ol className={cn('space-y-3', className)} aria-label="Plan activity">
      {entries.map((e) => {
        const meta = eventGlyph[e.eventType] ?? { color: 'bg-ink-subtle', label: e.eventType };
        return (
          <li key={e.id} className="flex items-start gap-3">
            <span aria-hidden className={cn('mt-1.5 h-2 w-2 rounded-full', meta.color)} />
            <div className="flex-1 text-xs">
              <p className="font-medium text-ink">{meta.label}</p>
              <p className="text-ink-muted">
                {e.actor} · {new Date(e.occurredAt).toLocaleString()}
              </p>
              {e.summary && <p className="mt-0.5 text-ink-soft">{e.summary}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
