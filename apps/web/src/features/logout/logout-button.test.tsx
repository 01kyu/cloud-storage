import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "@cs/shared";

import { routerMock } from "../../test/navigation";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { LogoutButton } from "./ui/logout-button";

const getMe = () => fetch(`${window.location.origin}${API_BASE_PATH}${API_ROUTES.auth.me}`);

beforeEach(async () => {
  await signInAsDemo();
});

describe("LogoutButton", () => {
  it("закрывает сессию и уводит на форму входа", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LogoutButton />);

    expect((await getMe()).status).toBe(200);

    await user.click(screen.getByRole("button", { name: "Выйти" }));

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/login");
    });
    expect((await getMe()).status).toBe(401);
  });
});
