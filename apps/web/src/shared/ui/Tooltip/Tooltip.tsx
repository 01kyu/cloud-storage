"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Tooltip.module.scss";

export const TooltipProvider = TooltipPrimitive.Provider;

export type TooltipProps = {
  content: ReactNode;
  /** Единственный элемент-триггер: обёртка не создаёт лишний DOM. */
  children: ReactElement;
  side?: ComponentProps<typeof TooltipPrimitive.Content>["side"];
  align?: ComponentProps<typeof TooltipPrimitive.Content>["align"];
  delayDuration?: number;
  className?: string;
};

export const Tooltip = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 300,
  className,
}: TooltipProps) => (
  <TooltipPrimitive.Root delayDuration={delayDuration}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        align={align}
        sideOffset={6}
        className={cn(styles.content, className)}
      >
        {content}
        <TooltipPrimitive.Arrow className={styles.arrow} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
