import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils/cn';
export function ChessChip({ label, color, size = 'sm', className }) {
    return (_jsxs("span", { className: cn('inline-flex items-center gap-1.5 rounded-md border border-border bg-white font-medium text-ink-soft', size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm', className), children: [_jsx("span", { "aria-hidden": true, className: "h-2 w-2 rounded-sm", style: { backgroundColor: color ?? '#D97757' } }), label] }));
}
//# sourceMappingURL=ChessChip.js.map