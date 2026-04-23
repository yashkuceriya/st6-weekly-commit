import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, actions, eyebrow, className }: SectionHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && (
          <p className="mb-1 font-mono text-xs font-medium uppercase tracking-wider text-claude-500">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-2xl tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
