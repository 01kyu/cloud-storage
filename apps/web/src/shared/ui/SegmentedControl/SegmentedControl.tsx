"use client";

import type { ReactNode } from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./SegmentedControl.module.scss";

export type SegmentedControlOption = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
};

export type SegmentedControlProps = {
  options: SegmentedControlOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label": string;
};

/** Одиночный выбор поверх `ToggleGroup`. */
export const SegmentedControl = ({
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps) => (
  <ToggleGroupPrimitive.Root
    type="single"
    value={value}
    defaultValue={defaultValue}
    onValueChange={onValueChange}
    disabled={disabled}
    aria-label={ariaLabel}
    className={cn(styles.root, className)}
  >
    {options.map((option) => (
      <ToggleGroupPrimitive.Item key={option.value} value={option.value} className={styles.item}>
        {option.icon}
        <span className={styles.label}>{option.label}</span>
      </ToggleGroupPrimitive.Item>
    ))}
  </ToggleGroupPrimitive.Root>
);
