import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'soft' | 'flat';
  interactive?: boolean;
};

export function Card({
  variant = 'default',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        variant === 'default' && 'border-border bg-white shadow-soft',
        variant === 'soft' && 'border-border-subtle bg-cream-50',
        variant === 'flat' && 'border-border bg-white',
        interactive &&
          'cursor-pointer transition-all duration-150 ease-out-soft hover:-translate-y-0.5 hover:shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn('px-5 py-4', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-border-subtle px-5 py-3',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
