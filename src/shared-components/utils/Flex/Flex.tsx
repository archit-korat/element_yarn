/*
Copyright 2024 New Vector Ltd.
Copyright 2023 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import classNames from "classnames";
import React, { type JSX, type ComponentProps, type JSXElementConstructor, useMemo } from "react";

import styles from "./Flex.module.css";

type FlexProps<T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>> = {
    /**
     * The type of the HTML element
     * @default div
     */
    as?: T;
    /**
     * The CSS class name.
     */
    className?: string;
    /**
     * The type of flex container
     * @default flex
     */
    display?: "flex" | "inline-flex";
    /**
     * The flow direction of the flex children
     * @default row
     */
    direction?: "row" | "column" | "row-reverse" | "column-reverse";
    /**
     * The alignment of the flex children
     * @default start
     */
    align?: "start" | "center" | "end" | "baseline" | "stretch" | "normal";
    /**
     * The justification of the flex children
     * @default start
     */
    justify?: "start" | "center" | "end" | "space-between";
    /**
     * The wrapping of the flex children
     * @default nowrap
     */
    wrap?: "wrap" | "nowrap" | "wrap-reverse";
    /**
     * The spacing between the flex children, expressed with the CSS unit
     * @default 0
     */
    gap?: string;
    /**
     * the on click event callback
     */
    onClick?: (e: React.MouseEvent) => void;
} & ComponentProps<T>;

/**
 * A flexbox container helper
 */
export function Flex<T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any> = "div">({
    as = "div",
    display = "flex",
    direction = "row",
    align = "start",
    justify = "start",
    gap = "0",
    wrap = "nowrap",
    className,
    children,
    ...props
}: React.PropsWithChildren<FlexProps<T>>): JSX.Element {
    const style = useMemo(
        () => ({
            "--mx-flex-display": display,
            "--mx-flex-direction": direction,
            "--mx-flex-align": align,
            "--mx-flex-justify": justify,
            "--mx-flex-gap": gap,
            "--mx-flex-wrap": wrap,
        }),
        [align, direction, display, gap, justify, wrap],
    );

    return React.createElement(as, { ...props, className: classNames(styles.flex, className), style }, children);
}
