import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routerMock } from "../../test/navigation";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { RequireAuth } from "./ui/require-auth";

describe("RequireAuth", () => {
  it("без сессии перенаправляет на /login и не рендерит содержимое", async () => {
    renderWithProviders(
      <RequireAuth>
        <p>Секрет</p>
      </RequireAuth>,
    );

    expect(await screen.findByText("Нужно войти — перенаправляем…")).toBeInTheDocument();
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Секрет")).not.toBeInTheDocument();
  });

  it("с сессией рендерит содержимое без редиректа", async () => {
    await signInAsDemo();

    renderWithProviders(
      <RequireAuth>
        <p>Секрет</p>
      </RequireAuth>,
    );

    expect(await screen.findByText("Секрет")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
