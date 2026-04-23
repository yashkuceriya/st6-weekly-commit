import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils/cn';
const eventGlyph = {
    PLAN_LOCKED: { color: 'bg-claude-400', label: 'Locked' },
    PLAN_RECONCILED: { color: 'bg-success', label: 'Reconciled' },
    REVIEW_SUBMITTED: { color: 'bg-claude-500', label: 'Reviewed' },
    COMMIT_ADDED: { color: 'bg-cream-400', label: 'Commit added' },
    COMMIT_EDITED: { color: 'bg-cream-300', label: 'Commit edited' },
    COMMIT_DELETED: { color: 'bg-danger', label: 'Commit removed' },
};
export function ActivityFeed({ entries, className }) {
    if (entries.length === 0) {
        return (_jsx("p", { className: cn('rounded-md border border-border-subtle bg-cream-50 px-3 py-4 text-xs text-ink-muted', className), children: "No activity yet." }));
    }
    return (_jsx("ol", { className: cn('space-y-3', className), "aria-label": "Plan activity", children: entries.map((e) => {
            const meta = eventGlyph[e.eventType] ?? { color: 'bg-ink-subtle', label: e.eventType };
            return (_jsxs("li", { className: "flex items-start gap-3", children: [_jsx("span", { "aria-hidden": true, className: cn('mt-1.5 h-2 w-2 rounded-full', meta.color) }), _jsxs("div", { className: "flex-1 text-xs", children: [_jsx("p", { className: "font-medium text-ink", children: meta.label }), _jsxs("p", { className: "text-ink-muted", children: [e.actor, " \u00B7 ", new Date(e.occurredAt).toLocaleString()] }), e.summary && _jsx("p", { className: "mt-0.5 text-ink-soft", children: e.summary })] })] }, e.id));
        }) }));
}
//# sourceMappingURL=ActivityFeed.js.map