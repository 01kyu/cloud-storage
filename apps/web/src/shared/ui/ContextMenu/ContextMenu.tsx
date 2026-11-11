"use client";

import type { ComponentPropsWithRef } from "react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./ContextMenu.module.scss";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

export type ContextMenuContentProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Content>;

export const ContextMenuContent = ({ className, children, ...props }: ContextMenuContentProps) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content className={cn(styles.content, className)} {...props}>
      {children}
    </ContextMenuPrimitive.Content>
  </ContextMenuPrimitive.Portal>
);

export type ContextMenuItemProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Item> & {
  tone?: "default" | "danger";
};

export const ContextMenuItem = ({
  className,
  tone = "default",
  ...props
}: ContextMenuItemProps) => (
  <ContextMenuPrimitive.Item
    className={cn(styles.item, tone === "danger" && styles.danger, className)}
    {...props}
  />
);

export const ContextMenuLabel = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof ContextMenuPrimitive.Label>) => (
  <ContextMenuPrimitive.Label className={cn(styles.label, className)} {...props} />
);

export const ContextMenuSeparator = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof ContextMenuPrimitive.Separator>) => (
  <ContextMenuPrimitive.Separator className={cn(styles.separator, className)} {...props} />
);
