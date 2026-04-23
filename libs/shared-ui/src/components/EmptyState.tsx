import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-gradient-to-b from-cream-50 to-white px-8 py-16 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-claude-50 text-claude-400 shadow-soft">
          {icon}
        </div>
      ) : (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-claude-50 shadow-soft">
          <svg className="h-7 w-7 text-claude-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      )}
      <h3 className="font-serif text-2xl text-ink">{title}</h3>
      {description && <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
