import type { ComponentPropsWithRef, CSSProperties } from "react";

import { cn } from "@shared/lib";

import styles from "./Skeleton.module.scss";

export type SkeletonProps = ComponentPropsWithRef<"div"> & {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  circle?: boolean;
};

export const Skeleton = ({
  width,
  height,
  circle = false,
  className,
  style,
  ...props
}: SkeletonProps) => (
  <div
    {...props}
    aria-hidden="true"
    className={cn(styles.root, circle && styles.circle, className)}
    style={{ width, height, ...style }}
  />
);
