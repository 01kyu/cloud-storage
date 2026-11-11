"use client";

import type { ComponentPropsWithRef } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Tabs.module.scss";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List className={cn(styles.list, className)} {...props} />
);

export const TabsTrigger = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger className={cn(styles.trigger, className)} {...props} />
);

export const TabsContent = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn(styles.content, className)} {...props} />
);
