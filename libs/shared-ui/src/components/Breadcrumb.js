import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { cn } from '../utils/cn';
const typeLabel = {
    RALLY_CRY: 'RC',
    DEFINING_OBJECTIVE: 'DO',
    OUTCOME: 'O',
    SUPPORTING_OUTCOME: 'SO',
};
const typeBadge = {
    RALLY_CRY: 'bg-claude-100 text-claude-700',
    DEFINING_OBJECTIVE: 'bg-cream-200 text-ink-soft',
    OUTCOME: 'bg-cream-100 text-ink-muted',
    SUPPORTING_OUTCOME: 'bg-success-subtle text-success',
};
export function Breadcrumb({ segments, size = 'sm', className }) {
    if (segments.length === 0)
        return null;
    return (_jsx("nav", { "aria-label": "Strategic alignment path", className: cn('flex flex-wrap items-center gap-x-1.5 gap-y-1', size === 'sm' ? 'text-xs' : 'text-sm', className), children: segments.map((seg, i) => (_jsxs(Fragment, { children: [seg.type ? (_jsx("span", { className: cn('rounded-sm px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wide', typeBadge[seg.type]), title: seg.type.replace('_', ' ').toLowerCase(), children: typeLabel[seg.type] })) : null, _jsx("span", { className: "text-ink-soft", children: seg.label }), i < segments.length - 1 && (_jsx("span", { "aria-hidden": true, className: "text-ink-subtle", children: "\u203A" }))] }, seg.id))) }));
}
//# sourceMappingURL=Breadcrumb.js.map