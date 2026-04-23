import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils/cn';
/**
 * Hand-rolled SVG sparkline. Zero deps, scales to any container, accessible
 * (renders a polyline + a final-value dot, with title element for screen
 * readers). Used on the manager rollup bar to show 8-week trends without
 * pulling in Recharts.
 */
export function Sparkline({ values, max, width = 96, height = 24, color = '#D97757', className, goodLow, }) {
    if (values.length === 0) {
        return _jsx("div", { className: cn('h-6 w-24', className), "aria-hidden": true });
    }
    const upperBound = max ?? Math.max(1, ...values, 100);
    const stepX = values.length === 1 ? 0 : width / (values.length - 1);
    const points = values
        .map((v, i) => {
        const x = i * stepX;
        const y = height - (v / upperBound) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
        .join(' ');
    const lastValue = values[values.length - 1] ?? 0;
    const firstValue = values[0] ?? 0;
    const trendUp = lastValue >= firstValue;
    const trendOk = goodLow ? !trendUp : trendUp;
    return (_jsxs("svg", { viewBox: `0 0 ${width} ${height}`, width: width, height: height, className: cn('overflow-visible', className), role: "img", "aria-label": `Trend: ${values.join(', ')}`, children: [_jsx("title", { children: values.join(', ') }), _jsx("polyline", { points: points, fill: "none", stroke: color, strokeWidth: "1.5", strokeLinejoin: "round", strokeLinecap: "round" }), _jsx("circle", { cx: (values.length - 1) * stepX, cy: height - (lastValue / upperBound) * height, r: "2", fill: trendOk ? '#5C8A4F' : '#C68A2E' })] }));
}
//# sourceMappingURL=Sparkline.js.map