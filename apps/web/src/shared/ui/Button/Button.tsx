"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@shared/lib";

import styles from "./Button.module.scss";

const buttonVariants = cva(styles.root, {
  variants: {
    variant: {
      primary: styles.primary,
      secondary: styles.secondary,
      ghost: styles.ghost,
      danger: styles.danger,
    },
    size: {
      sm: styles.sm,
      md: styles.md,
      lg: styles.lg,
    },
    fullWidth: {
      true: styles.fullWidth,
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export type ButtonProps = ComponentPropsWithRef<"button"> &
  ButtonVariantProps & {
    loading?: boolean;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
  };

export const Button = ({
  variant,
  size,
  fullWidth,
  loading = false,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    {...props}
    type={type}
    className={cn(buttonVariants({ variant, size, fullWidth }), className)}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
  >
    {loading ? <Loader2 className={styles.spinner} size={16} aria-hidden /> : iconLeft}
    {children === undefined || children === null ? null : (
      <span className={styles.label}>{children}</span>
    )}
    {iconRight}
  </button>
);
