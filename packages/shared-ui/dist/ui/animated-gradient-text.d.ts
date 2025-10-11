import { ComponentPropsWithoutRef } from "react";
export interface AnimatedGradientTextProps extends ComponentPropsWithoutRef<"div"> {
    speed?: number;
    colorFrom?: string;
    colorTo?: string;
}
export declare function AnimatedGradientText({ children, className, speed, colorFrom, colorTo, ...props }: AnimatedGradientTextProps): import("react/jsx-runtime").JSX.Element;
export default AnimatedGradientText;
