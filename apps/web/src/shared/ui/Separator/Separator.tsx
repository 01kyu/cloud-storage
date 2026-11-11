"use client";

import type { ComponentPropsWithRef } from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Separator.module.scss";

export type SeparatorProps = ComponentPropsWithRef<typeof SeparatorPrimitive.Root>;

export const Separator = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) => (
  <SeparatorPrimitive.Root
    orientation={orientation}
    decorative={decorative}
    className={cn(styles.root, styles[orientation], className)}
    {...props}
  />
);
