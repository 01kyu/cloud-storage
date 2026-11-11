import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES, DEMO_USER } from "@cs/shared";

import { routerMock } from "../../test/navigation";
import { renderWithProviders } from "../../test/render-with-providers";

import { LoginForm } from "./ui/login-form";

const getMe = () => fetch(`${window.location.origin}${API_BASE_PATH}${API_ROUTES.auth.me}`);

/** Форма входа на реальном store + MSW: проверяем валидацию и работу мутации. */
describe("LoginForm", () => {
  it("показывает ошибки валидации и не отправляет запрос", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Введите корректный email")).toBeInTheDocument();
    expect(screen.getByText("Пароль не короче 8 символов")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("показывает сообщение API при неверном пароле", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), DEMO_USER.email);
    await user.type(screen.getByLabelText("Пароль"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Неверный email или пароль");
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect((await getMe()).status).toBe(401);
  });

  it("подставляет демо-данные и после входа уводит в хранилище", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Подставить демо-данные" }));

    expect(screen.getByLabelText("Email")).toHaveValue(DEMO_USER.email);
    expect(screen.getByLabelText("Пароль")).toHaveValue(DEMO_USER.password);

    await user.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/files");
    });
    expect((await getMe()).status).toBe(200);
  });
});
