import { ComponentPropsWithoutRef } from "react";
interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
    value: number;
    startValue?: number;
    direction?: "up" | "down";
    delay?: number;
    decimalPlaces?: number;
}
export declare function NumberTicker({ value, startValue, direction, delay, className, decimalPlaces, ...props }: NumberTickerProps): import("react/jsx-runtime").JSX.Element;
export {};
