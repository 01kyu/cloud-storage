import type { ComponentPropsWithRef } from "react";

import { cn } from "@shared/lib";

import styles from "./Input.module.scss";

export type InputProps = ComponentPropsWithRef<"input"> & {
  invalid?: boolean;
};

export const Input = ({
  invalid = false,
  className,
  type = "text",
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) => (
  <input
    {...props}
    type={type}
    aria-invalid={invalid || ariaInvalid || undefined}
    className={cn(styles.root, invalid && styles.invalid, className)}
  />
);
