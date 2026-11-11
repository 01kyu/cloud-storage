"use client";

import type { ComponentPropsWithRef } from "react";
import { X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Toast.module.scss";

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof ToastPrimitive.Viewport>) => (
  <ToastPrimitive.Viewport className={cn(styles.viewport, className)} {...props} />
);

export type ToastRootProps = ComponentPropsWithRef<typeof ToastPrimitive.Root> & {
  tone?: "info" | "success" | "danger";
};

export const ToastRoot = ({ className, tone = "info", ...props }: ToastRootProps) => (
  <ToastPrimitive.Root className={cn(styles.root, styles[tone], className)} {...props} />
);

export const ToastTitle = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof ToastPrimitive.Title>) => (
  <ToastPrimitive.Title className={cn(styles.title, className)} {...props} />
);

export const ToastDescription = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof ToastPrimitive.Description>) => (
  <ToastPrimitive.Description className={cn(styles.description, className)} {...props} />
);

export const ToastAction = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof ToastPrimitive.Action>) => (
  <ToastPrimitive.Action className={cn(styles.action, className)} {...props} />
);

export const ToastClose = ({
  className,
  children,
  ...props
}: ComponentPropsWithRef<typeof ToastPrimitive.Close>) => (
  <ToastPrimitive.Close aria-label="Закрыть" className={cn(styles.close, className)} {...props}>
    {children ?? <X size={16} aria-hidden="true" />}
  </ToastPrimitive.Close>
);
