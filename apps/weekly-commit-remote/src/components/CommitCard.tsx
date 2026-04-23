import type { ChessLayerCategory, WeeklyCommit } from '@st6/shared-types';
import {
  type BreadcrumbSegment,
  Card,
  CardBody,
  cn,
} from '@st6/shared-ui';
import type { CommitFieldErrors } from '../lib/lock-validation';

interface CommitCardProps {
  commit: WeeklyCommit;
  chessLayer?: ChessLayerCategory;
  pathSegments?: BreadcrumbSegment[];
  errors?: CommitFieldErrors;
  locked?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityStyle: Record<number, string> = {
  1: 'bg-danger-subtle text-danger border-danger/20',
  2: 'bg-warning-subtle text-warning border-warning/20',
  3: 'bg-cream-100 text-ink-muted border-border',
};

export function CommitCard({
  commit,
  chessLayer,
  pathSegments,
  errors,
  locked,
  onEdit,
  onDelete,
}: CommitCardProps) {
  const hasErrors = errors && Object.keys(errors).length > 0;

  return (
    <Card
      className={cn(
        'group/card overflow-hidden transition-all duration-200 ease-out-soft',
        'hover:shadow-lift hover:border-border-strong hover:-translate-y-0.5 hover:scale-[1.005]',
        hasErrors && 'border-danger/40 bg-danger-subtle/20',
      )}
      style={chessLayer ? { borderLeftWidth: '3px', borderLeftColor: chessLayer.color } : undefined}
    >
      <CardBody className="space-y-3 px-5 py-5">
        {/* Row 1: drag handle · priority · chess layer · breadcrumb */}
        <div className="flex items-center gap-2.5">
          {!locked && (
            <span
              className="flex cursor-move select-none flex-col items-center gap-px rounded px-0.5 py-1 text-ink-subtle/50 transition-colors group-hover/card:text-ink-muted"
              aria-label="Drag to reorder"
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
                <circle cx="2" cy="2" r="1.25" />
                <circle cx="8" cy="2" r="1.25" />
                <circle cx="2" cy="7" r="1.25" />
                <circle cx="8" cy="7" r="1.25" />
                <circle cx="2" cy="12" r="1.25" />
                <circle cx="8" cy="12" r="1.25" />
              </svg>
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase leading-none border',
              priorityStyle[commit.priorityRank] ?? priorityStyle[3],
            )}
          >
            P{commit.priorityRank}
          </span>
          {chessLayer && (
            <span
              className="inline-flex items-center rounded px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase leading-none"
              style={{
                backgroundColor: chessLayer.color + '18',
                color: chessLayer.color,
                borderLeft: `3px solid ${chessLayer.color}`,
              }}
            >
              {chessLayer.name}
            </span>
          )}
          {pathSegments && pathSegments.length > 1 && (
            <span className="font-mono text-[0.65rem] text-ink-muted">
              {pathSegments.slice(-2).map((s, i) => (
                <span key={s.id}>
                  {i > 0 && <span className="mx-1 text-ink-subtle">›</span>}
                  {s.label}
                </span>
              ))}
            </span>
          )}
          {/* Edit / Delete pushed right */}
          <div className="ml-auto flex items-center gap-1">
            {!locked && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-md px-2 py-1 text-xs text-ink-soft transition-colors hover:bg-cream-100"
              >
                Edit
              </button>
            )}
            {!locked && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-md px-2 py-1 text-xs text-ink-subtle transition-colors hover:bg-danger-subtle hover:text-danger"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Title */}
        <h4 className="font-serif text-lg leading-snug text-ink">{commit.title}</h4>

        {/* Row 3: Evidence */}
        {commit.expectedEvidence && (
          <div className="flex items-start gap-2 rounded-md bg-cream-50 px-3 py-2 text-xs text-ink-muted">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-subtle" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 1.5L14.5 4.5M8 12L1.5 14.5L4 8L11.75 0.25C12.5 1 13.5 2 14.5 2.75L8 12Z" />
            </svg>
            <span>
              <span className="font-medium text-ink-soft">Expected evidence:</span>{' '}
              <span className="italic">{commit.expectedEvidence}</span>
            </span>
          </div>
        )}

        {/* Errors */}
        {hasErrors && (
          <ul className="space-y-1 rounded-md bg-danger-subtle/40 p-3 text-xs text-danger">
            {Object.entries(errors).map(([field, msg]) => (
              <li key={field} className="flex items-start gap-1.5">
                <span className="mt-0.5">●</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Carry generation */}
        {commit.carryGeneration > 1 && (
          <p className="text-xs text-ink-subtle">
            Carry generation {commit.carryGeneration} · provenance from {commit.sourceCommitId}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
