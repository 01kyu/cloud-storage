"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";

import { DEMO_USER } from "@cs/shared";
import { useLoginMutation } from "@entities/user";
import { ROUTES } from "@shared/config";
import { getApiErrorMessage } from "@shared/lib";
import { Button, Field, Input } from "@shared/ui";

import { loginFormSchema, type LoginFormValues } from "../model/login-form-schema";

import styles from "./login-form.module.scss";

const DEFAULT_VALUES: LoginFormValues = { email: "", password: "" };

export const LoginForm = () => {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await login(values).unwrap();
      router.replace(ROUTES.files);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Не удалось войти. Попробуйте ещё раз"));
    }
  });

  const fillDemoCredentials = (): void => {
    setFormError(null);
    reset({ ...DEMO_USER });
  };

  return (
    <form className={styles.root} onSubmit={onSubmit} noValidate>
      <Field label="Email" error={errors.email?.message} required>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
      </Field>

      <Field label="Пароль" error={errors.password?.message} required>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </Field>

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        fullWidth
        loading={isLoading || isSubmitting}
        iconLeft={<LogIn size={16} aria-hidden="true" />}
      >
        Войти
      </Button>

      <div className={styles.demo}>
        <p className={styles.demoText}>
          Демо-доступ: <code className={styles.code}>{DEMO_USER.email}</code> /{" "}
          <code className={styles.code}>{DEMO_USER.password}</code>
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={fillDemoCredentials}>
          Подставить демо-данные
        </Button>
      </div>
    </form>
  );
};
