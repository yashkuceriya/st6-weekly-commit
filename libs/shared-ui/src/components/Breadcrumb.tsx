import { Fragment } from 'react';
import { cn } from '../utils/cn';

export interface BreadcrumbSegment {
  id: string;
  label: string;
  type?: 'RALLY_CRY' | 'DEFINING_OBJECTIVE' | 'OUTCOME' | 'SUPPORTING_OUTCOME';
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  size?: 'sm' | 'md';
  className?: string;
}

const typeLabel: Record<NonNullable<BreadcrumbSegment['type']>, string> = {
  RALLY_CRY: 'RC',
  DEFINING_OBJECTIVE: 'DO',
  OUTCOME: 'O',
  SUPPORTING_OUTCOME: 'SO',
};

const typeBadge: Record<NonNullable<BreadcrumbSegment['type']>, string> = {
  RALLY_CRY: 'bg-claude-100 text-claude-700',
  DEFINING_OBJECTIVE: 'bg-cream-200 text-ink-soft',
  OUTCOME: 'bg-cream-100 text-ink-muted',
  SUPPORTING_OUTCOME: 'bg-success-subtle text-success',
};

export function Breadcrumb({ segments, size = 'sm', className }: BreadcrumbProps) {
  if (segments.length === 0) return null;
  return (
    <nav
      aria-label="Strategic alignment path"
      className={cn(
        'flex flex-wrap items-center gap-x-1.5 gap-y-1',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      {segments.map((seg, i) => (
        <Fragment key={seg.id}>
          {seg.type ? (
            <span
              className={cn(
                'rounded-sm px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wide',
                typeBadge[seg.type],
              )}
              title={seg.type.replace('_', ' ').toLowerCase()}
            >
              {typeLabel[seg.type]}
            </span>
          ) : null}
          <span className="text-ink-soft">{seg.label}</span>
          {i < segments.length - 1 && (
            <span aria-hidden className="text-ink-subtle">
              ›
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
