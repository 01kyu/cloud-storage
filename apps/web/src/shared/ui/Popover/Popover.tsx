"use client";

import type { ComponentPropsWithRef } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Popover.module.scss";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export type PopoverContentProps = ComponentPropsWithRef<typeof PopoverPrimitive.Content>;

export const PopoverContent = ({
  className,
  align = "start",
  sideOffset = 6,
  children,
  ...props
}: PopoverContentProps) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(styles.content, className)}
      {...props}
    >
      {children}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
);
