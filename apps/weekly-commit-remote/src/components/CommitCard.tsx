import type { ChessLayerCategory, WeeklyCommit } from '@st6/shared-types';
import {
  Breadcrumb,
  type BreadcrumbSegment,
  Card,
  CardBody,
  ChessChip,
  StatusBadge,
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
  const status = commit.reconciliation?.status;

  return (
    <Card variant={hasErrors ? 'flat' : 'default'} className={cn(hasErrors && 'border-danger/40 bg-danger-subtle/30')}>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-subtle">#{commit.priorityRank}</span>
              <h4 className="font-serif text-lg text-ink">{commit.title}</h4>
              {commit.requiresManagerAck && (
                <span className="rounded-md bg-warning-subtle px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-warning">
                  Mgr ack
                </span>
              )}
            </div>
            {commit.rationale && <p className="text-sm text-ink-muted">{commit.rationale}</p>}
          </div>
          <div className="flex items-center gap-2">
            {status && <StatusBadge status={status} />}
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

        {pathSegments && pathSegments.length > 0 && (
          <div className="rounded-md bg-cream-50 px-3 py-2">
            <Breadcrumb segments={pathSegments} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {chessLayer && <ChessChip label={chessLayer.name} color={chessLayer.color} />}
          {commit.expectedEvidence && (
            <p className="text-xs text-ink-muted">
              <span className="font-medium text-ink-soft">Evidence:</span> {commit.expectedEvidence}
            </p>
          )}
        </div>

        {hasErrors && (
          <ul className="space-y-1 rounded-md bg-danger-subtle/40 p-3 text-xs text-danger">
            {Object.entries(errors).map(([field, msg]) => (
              <li key={field} className="flex items-start gap-1.5">
                <span aria-hidden>⚠</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        )}

        {commit.carryGeneration > 1 && (
          <p className="text-xs text-ink-subtle">
            Carry generation {commit.carryGeneration} · provenance from {commit.sourceCommitId}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
