"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@entities/user";
import { ROUTES } from "@shared/config";

import styles from "./require-auth.module.scss";

export type RequireAuthProps = {
  children: ReactNode;
};

/** Сессию знает только API, поэтому решение принимается после ответа, а не в middleware. */
export const RequireAuth = ({ children }: RequireAuthProps) => {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(ROUTES.login);
    }
  }, [isLoading, router, user]);

  if (!user) {
    return (
      <div className={styles.root}>
        <p className={styles.status} role="status">
          {isLoading ? "Проверяем сессию…" : "Нужно войти — перенаправляем…"}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
