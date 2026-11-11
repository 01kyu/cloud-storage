"use client";

import { cloneElement, useId, type ReactElement, type ReactNode } from "react";

import { cn } from "@shared/lib";

import styles from "./Field.module.scss";

export type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
};

export type FieldProps = {
  label: ReactNode;
  /** Ровно один контрол: `Input`, `Textarea`, `Checkbox` и т.п. */
  children: ReactElement<FieldControlProps>;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
};

/** Сам связывает контрол с текстами через `id` / `aria-describedby` / `aria-invalid`. */
export const Field = ({
  label,
  children,
  hint,
  error,
  required = false,
  className,
}: FieldProps) => {
  const generatedId = useId();
  const controlId = children.props.id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [
    children.props["aria-describedby"],
    hint && !error ? hintId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  const control = cloneElement(children, {
    id: controlId,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : children.props["aria-invalid"],
    "aria-required": required || undefined,
  });

  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={controlId}>
          {label}
        </label>
        {required ? (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </div>
      {control}
      {hint && !error ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
