'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
export const AuroraText = memo(({ children, className = '', colors = ['#FF0080', '#7928CA', '#0070F3', '#38bdf8'], speed = 1, }) => {
    const gradientStyle = {
        backgroundImage: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animationDuration: `${10 / speed}s`,
    };
    return (_jsxs("span", { className: `relative inline-block ${className}`, children: [_jsx("span", { className: "sr-only", children: children }), _jsx("span", { className: "relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent", style: gradientStyle, "aria-hidden": "true", children: children })] }));
});
AuroraText.displayName = 'AuroraText';
