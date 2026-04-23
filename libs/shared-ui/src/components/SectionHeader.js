import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils/cn';
export function SectionHeader({ title, subtitle, actions, eyebrow, className }) {
    return (_jsxs("header", { className: cn('flex flex-wrap items-end justify-between gap-4', className), children: [_jsxs("div", { children: [eyebrow && (_jsx("p", { className: "mb-1 font-mono text-xs font-medium uppercase tracking-wider text-claude-500", children: eyebrow })), _jsx("h2", { className: "font-serif text-2xl tracking-tight text-ink", children: title }), subtitle && _jsx("p", { className: "mt-1 max-w-2xl text-sm text-ink-muted", children: subtitle })] }), actions && _jsx("div", { className: "flex items-center gap-2", children: actions })] }));
}
//# sourceMappingURL=SectionHeader.js.map