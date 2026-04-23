import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils/cn';
export function EmptyState({ icon, title, description, action, className }) {
    return (_jsxs("div", { className: cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-cream-50 px-6 py-12 text-center', className), children: [icon && _jsx("div", { className: "mb-4 text-claude-400", children: icon }), _jsx("h3", { className: "font-serif text-xl text-ink", children: title }), description && _jsx("p", { className: "mt-2 max-w-md text-sm text-ink-muted", children: description }), action && _jsx("div", { className: "mt-6", children: action })] }));
}
//# sourceMappingURL=EmptyState.js.map