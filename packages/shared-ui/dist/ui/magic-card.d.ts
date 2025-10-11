import React from "react";
interface MagicCardProps {
    children?: React.ReactNode;
    className?: string;
    gradientSize?: number;
    gradientColor?: string;
    gradientOpacity?: number;
    gradientFrom?: string;
    gradientTo?: string;
}
export declare function MagicCard({ children, className, gradientSize, gradientColor, gradientOpacity, gradientFrom, gradientTo, }: MagicCardProps): import("react/jsx-runtime").JSX.Element;
export {};
