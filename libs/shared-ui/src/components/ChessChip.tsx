import { cn } from '../utils/cn';

interface ChessChipProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function ChessChip({ label, color, size = 'sm', className }: ChessChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-white font-medium text-ink-soft',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-sm"
        style={{ backgroundColor: color ?? '#D97757' }}
      />
      {label}
    </span>
  );
}
