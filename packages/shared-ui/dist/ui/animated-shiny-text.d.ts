import { ComponentPropsWithoutRef, FC } from "react";
export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
    shimmerWidth?: number;
}
export declare const AnimatedShinyText: FC<AnimatedShinyTextProps>;
export default AnimatedShinyText;
