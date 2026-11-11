import type { ComponentPropsWithRef } from "react";

import { cn } from "@shared/lib";

import styles from "./Textarea.module.scss";

export type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  invalid?: boolean;
};

export const Textarea = ({
  invalid = false,
  className,
  rows = 4,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaProps) => (
  <textarea
    {...props}
    rows={rows}
    aria-invalid={invalid || ariaInvalid || undefined}
    className={cn(styles.root, invalid && styles.invalid, className)}
  />
);
