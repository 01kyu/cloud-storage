import { API_BASE_PATH, API_ROUTES, DEMO_USER } from "@cs/shared";

/** Открывает сессию настоящим запросом входа: в сидах сессии нет. */
export const signInAsDemo = async (): Promise<void> => {
  const response = await fetch(
    `${window.location.origin}${API_BASE_PATH}${API_ROUTES.auth.login}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEMO_USER),
    },
  );

  if (!response.ok) {
    throw new Error(`Не удалось открыть тестовую сессию: ${response.status}`);
  }
};
