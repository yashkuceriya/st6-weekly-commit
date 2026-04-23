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
        'transition-shadow hover:shadow-lift hover:border-strong',
        hasErrors && 'border-danger/40 bg-danger-subtle/20',
      )}
    >
      <CardBody className="space-y-2 px-5 py-4">
        {/* Row 1: drag handle · priority · chess layer · breadcrumb */}
        <div className="flex items-center gap-2">
          {!locked && (
            <span className="cursor-move select-none text-ink-subtle" aria-label="Drag to reorder">⋮⋮</span>
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
          {pathSegments && pathSegments.length > 0 && (
            <span className="font-mono text-[0.65rem] text-ink-muted">
              {pathSegments.map((s, i) => (
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

        {/* Row 2 (breadcrumb second line when SO is deep) */}
        {pathSegments && pathSegments.length > 2 && (
          <p className="ml-[1.1rem] font-mono text-[0.6rem] uppercase tracking-wide text-ink-subtle">
            {pathSegments.slice(-2).map((s) => s.label).join(' › ')}
          </p>
        )}

        {/* Row 3: Title */}
        <h4 className="font-serif text-[1.125rem] leading-snug text-ink">{commit.title}</h4>

        {/* Row 4: Evidence */}
        {commit.expectedEvidence && (
          <p className="flex items-start gap-1.5 text-xs text-ink-muted">
            <span className="mt-0.5 text-ink-subtle">✎</span>
            <span>
              <span className="font-medium text-ink-soft">Expected evidence:</span>{' '}
              <span className="italic">{commit.expectedEvidence}</span>
            </span>
          </p>
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
