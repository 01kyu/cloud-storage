"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Checkbox.module.scss";

export type CheckboxProps = ComponentPropsWithRef<typeof CheckboxPrimitive.Root> & {
  label?: ReactNode;
};

export const Checkbox = ({ label, id, className, checked, ...props }: CheckboxProps) => {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const indeterminate = checked === "indeterminate";

  const control = (
    <CheckboxPrimitive.Root
      {...props}
      id={controlId}
      checked={checked}
      className={cn(styles.root, className)}
    >
      <CheckboxPrimitive.Indicator className={styles.indicator}>
        {indeterminate ? (
          <Minus size={14} aria-hidden="true" />
        ) : (
          <Check size={14} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (label === undefined || label === null) {
    return control;
  }

  return (
    <div className={styles.wrapper}>
      {control}
      <label className={styles.label} htmlFor={controlId}>
        {label}
      </label>
    </div>
  );
};
