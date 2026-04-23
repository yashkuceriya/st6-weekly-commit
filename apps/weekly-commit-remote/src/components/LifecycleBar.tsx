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

function CheckIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 6.5L5 9L9.5 3.5" />
    </svg>
  );
}

function StepDot({ isDone, isActive }: { isDone: boolean; isActive: boolean }) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
        isDone && 'border-claude-400 bg-claude-400 text-white',
        isActive && 'border-claude-400 bg-white shadow-focus',
        !isDone && !isActive && 'border-border bg-cream-100',
      )}
    >
      {isDone ? (
        <CheckIcon />
      ) : isActive ? (
        <span className="h-2 w-2 rounded-full bg-claude-400" />
      ) : null}
    </span>
  );
}

export function LifecycleBar({ current }: LifecycleBarProps) {
  const currentIdx = ORDER[current];

  return (
    <div className="flex items-center">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;

        return (
          <div key={step.state} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  'h-0.5 w-8 transition-colors duration-200',
                  isDone || isActive ? 'bg-claude-400' : 'bg-border',
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <StepDot isDone={isDone} isActive={isActive} />
              <span
                className={cn(
                  'font-mono text-[0.65rem] uppercase tracking-wider transition-colors',
                  isActive && 'font-semibold text-claude-500',
                  isDone && 'font-medium text-claude-600',
                  !isActive && !isDone && 'text-ink-subtle',
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
