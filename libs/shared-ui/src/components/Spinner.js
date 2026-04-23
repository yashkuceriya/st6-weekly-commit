import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../utils/cn';
const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
export function Spinner({ size = 'md', className }) {
    return (_jsx("span", { role: "status", "aria-label": "Loading", className: cn('inline-block animate-spin rounded-full border-2 border-claude-200 border-t-claude-500', sizes[size], className) }));
}
//# sourceMappingURL=Spinner.js.map