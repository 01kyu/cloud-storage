import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ROUTES } from "@shared/config";

import { routerMock } from "../../test/navigation";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { LoginView } from "./login-view";

describe("LoginView", () => {
  it("показывает форму входа без сессии", async () => {
    renderWithProviders(<LoginView />);

    expect(await screen.findByRole("heading", { name: "Вход" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("уводит в хранилище, если сессия уже открыта", async () => {
    await signInAsDemo();

    renderWithProviders(<LoginView />);

    expect(
      await screen.findByText("Вы уже вошли — перенаправляем в хранилище…"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith(ROUTES.files);
    });
  });
});
