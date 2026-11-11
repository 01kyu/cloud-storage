"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@shared/lib";

import styles from "./IconButton.module.scss";

const iconButtonVariants = cva(styles.root, {
  variants: {
    variant: {
      ghost: styles.ghost,
      solid: styles.solid,
      subtle: styles.subtle,
    },
    size: {
      sm: styles.sm,
      md: styles.md,
    },
    tone: {
      default: styles.toneDefault,
      danger: styles.toneDanger,
    },
  },
  defaultVariants: {
    variant: "ghost",
    size: "md",
    tone: "default",
  },
});

export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;

export type IconButtonProps = ComponentPropsWithRef<"button"> &
  IconButtonVariantProps & {
    /** Обязательная: иконка без текстовой метки недоступна скринридерам. */
    label: string;
    children: ReactNode;
  };

export const IconButton = ({
  label,
  variant,
  size,
  tone,
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) => (
  <button
    {...props}
    type={type}
    aria-label={label}
    className={cn(iconButtonVariants({ variant, size, tone }), className)}
  >
    {children}
  </button>
);
