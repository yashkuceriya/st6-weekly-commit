import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from '../utils/cn';
const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md font-medium ' +
    'transition-all duration-150 ease-out-soft ' +
    'disabled:cursor-not-allowed disabled:opacity-50 ' +
    'focus-visible:outline-none';
const variantClasses = {
    primary: 'bg-claude-400 text-white shadow-soft hover:bg-claude-500 active:bg-claude-600 ' +
        'disabled:hover:bg-claude-400',
    secondary: 'bg-white text-ink border border-border hover:bg-cream-100 hover:border-border-strong ' +
        'active:bg-cream-200',
    ghost: 'bg-transparent text-ink-soft hover:bg-cream-100 hover:text-ink active:bg-cream-200',
    danger: 'bg-danger text-white hover:bg-danger/90 active:bg-danger/80 ' +
        'disabled:hover:bg-danger',
};
const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};
export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', loading = false, iconLeft, iconRight, className, disabled, children, ...rest }, ref) {
    return (_jsxs("button", { ref: ref, className: cn(baseClasses, variantClasses[variant], sizeClasses[size], className), disabled: disabled || loading, ...rest, children: [loading ? (_jsx("span", { className: "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", "aria-hidden": true })) : (iconLeft), _jsx("span", { children: children }), !loading && iconRight] }));
});
//# sourceMappingURL=Button.js.map