"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Avatar.module.scss";

export type AvatarProps = Omit<ComponentPropsWithRef<typeof AvatarPrimitive.Root>, "children"> & {
  /** При отсутствии или ошибке показывается `fallback`. */
  src?: string;
  alt: string;
  fallback: ReactNode;
  size?: "sm" | "md" | "lg";
};

export const Avatar = ({ src, alt, fallback, size = "md", className, ...props }: AvatarProps) => (
  <AvatarPrimitive.Root className={cn(styles.root, styles[size], className)} {...props}>
    {src ? <AvatarPrimitive.Image className={styles.image} src={src} alt={alt} /> : null}
    <AvatarPrimitive.Fallback className={styles.fallback} delayMs={0}>
      {fallback}
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
);
