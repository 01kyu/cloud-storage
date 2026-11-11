"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useLogoutMutation } from "@entities/user";
import { ROUTES } from "@shared/config";
import { IconButton } from "@shared/ui";

export const LogoutButton = () => {
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout().unwrap();
    } catch {
      // Сессии уже нет или сеть недоступна — всё равно уводим на форму входа.
    } finally {
      router.replace(ROUTES.login);
    }
  };

  return (
    <IconButton label="Выйти" size="sm" disabled={isLoading} onClick={() => void handleLogout()}>
      <LogOut size={16} aria-hidden="true" />
    </IconButton>
  );
};
