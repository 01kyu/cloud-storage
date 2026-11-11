"use client";

import type { ComponentPropsWithRef } from "react";
import { Check } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./DropdownMenu.module.scss";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export type DropdownMenuContentProps = ComponentPropsWithRef<typeof DropdownMenuPrimitive.Content>;

export const DropdownMenuContent = ({
  className,
  align = "start",
  sideOffset = 6,
  children,
  ...props
}: DropdownMenuContentProps) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(styles.content, className)}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
);

export type DropdownMenuItemProps = ComponentPropsWithRef<typeof DropdownMenuPrimitive.Item> & {
  tone?: "default" | "danger";
};

export const DropdownMenuItem = ({
  className,
  tone = "default",
  ...props
}: DropdownMenuItemProps) => (
  <DropdownMenuPrimitive.Item
    className={cn(styles.item, tone === "danger" && styles.danger, className)}
    {...props}
  />
);

export const DropdownMenuLabel = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof DropdownMenuPrimitive.Label>) => (
  <DropdownMenuPrimitive.Label className={cn(styles.label, className)} {...props} />
);

export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuRadioItem = ({
  className,
  children,
  ...props
}: ComponentPropsWithRef<typeof DropdownMenuPrimitive.RadioItem>) => (
  <DropdownMenuPrimitive.RadioItem
    className={cn(styles.item, styles.radioItem, className)}
    {...props}
  >
    <span className={styles.indicator} aria-hidden="true">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check size={14} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
);

export const DropdownMenuSeparator = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof DropdownMenuPrimitive.Separator>) => (
  <DropdownMenuPrimitive.Separator className={cn(styles.separator, className)} {...props} />
);
