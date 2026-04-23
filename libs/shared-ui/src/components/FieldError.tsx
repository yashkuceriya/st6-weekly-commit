import { cn } from '../utils/cn';

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn('mt-1 flex items-start gap-1 text-xs text-danger', className)}
    >
      <span aria-hidden>⚠</span>
      <span>{message}</span>
    </p>
  );
}
