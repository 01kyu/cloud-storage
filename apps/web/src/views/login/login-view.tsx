"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HardDrive } from "lucide-react";

import { useCurrentUser } from "@entities/user";
import { LoginForm } from "@features/auth-by-email";
import { ROUTES } from "@shared/config";

import styles from "./login-view.module.scss";

/** Открытую сессию сразу уводит в хранилище: `/login` не должен быть тупиком. */
export const LoginView = () => {
  const router = useRouter();
  const { user } = useCurrentUser();

  useEffect(() => {
    if (user) {
      router.replace(ROUTES.files);
    }
  }, [router, user]);

  return (
    <div className={styles.root}>
      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.brand}>
          <HardDrive size={22} aria-hidden="true" className={styles.brandIcon} />
          <span>Cloud Storage</span>
        </div>

        <h1 className={styles.title} id="login-title">
          Вход
        </h1>
        <p className={styles.subtitle}>Войдите, чтобы открыть свои файлы.</p>

        {user ? (
          <p className={styles.redirect} role="status">
            Вы уже вошли — перенаправляем в хранилище…
          </p>
        ) : (
          <LoginForm />
        )}
      </section>
    </div>
  );
};
