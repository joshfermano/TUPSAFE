import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cn } from "../lib/utils";
export function GridPattern({ width = 40, height = 40, x = -1, y = -1, strokeDasharray = "0", squares, className, ...props }) {
    const id = useId();
    return (_jsxs("svg", { "aria-hidden": "true", className: cn("pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30", className), ...props, children: [_jsx("defs", { children: _jsx("pattern", { id: id, width: width, height: height, patternUnits: "userSpaceOnUse", x: x, y: y, children: _jsx("path", { d: `M.5 ${height}V.5H${width}`, fill: "none", strokeDasharray: strokeDasharray }) }) }), _jsx("rect", { width: "100%", height: "100%", strokeWidth: 0, fill: `url(#${id})` }), squares && (_jsx("svg", { x: x, y: y, className: "overflow-visible", children: squares.map(([x, y]) => (_jsx("rect", { strokeWidth: "0", width: width - 1, height: height - 1, x: x * width + 1, y: y * height + 1 }, `${x}-${y}`))) }))] }));
}
