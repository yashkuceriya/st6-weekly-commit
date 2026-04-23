import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils/cn';
export function FieldError({ message, className }) {
    if (!message)
        return null;
    return (_jsxs("p", { role: "alert", className: cn('mt-1 flex items-start gap-1 text-xs text-danger', className), children: [_jsx("span", { "aria-hidden": true, children: "\u26A0" }), _jsx("span", { children: message })] }));
}
//# sourceMappingURL=FieldError.js.map