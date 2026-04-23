import type { PlanState } from '@st6/shared-types';
import { cn } from '@st6/shared-ui';

interface LifecycleBarProps {
  current: PlanState;
}

const STEPS: { state: PlanState; label: string }[] = [
  { state: 'DRAFT', label: 'Draft' },
  { state: 'LOCKED', label: 'Locked' },
  { state: 'RECONCILING', label: 'Reconciling' },
  { state: 'RECONCILED', label: 'Reconciled' },
];

const ORDER: Record<PlanState, number> = {
  DRAFT: 0,
  LOCKED: 1,
  RECONCILING: 2,
  RECONCILED: 3,
};

export function LifecycleBar({ current }: LifecycleBarProps) {
  const currentIdx = ORDER[current];

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;

        return (
          <div key={step.state} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  'h-px w-6',
                  isDone || isActive ? 'bg-claude-400' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'rounded-full px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider transition-colors',
                isActive && 'bg-claude-400 text-white',
                isDone && 'bg-claude-100 text-claude-600',
                !isActive && !isDone && 'bg-cream-100 text-ink-subtle',
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
