"use client";

import type { ComponentPropsWithRef } from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Progress.module.scss";

export type ProgressProps = Omit<
  ComponentPropsWithRef<typeof ProgressPrimitive.Root>,
  "value" | "max"
> & {
  value: number;
  max?: number;
  size?: "sm" | "md";
};

export const Progress = ({ value, max = 100, size = "md", className, ...props }: ProgressProps) => {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <ProgressPrimitive.Root
      max={max}
      value={clamped}
      className={cn(styles.root, styles[size], className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={styles.indicator}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  );
};
