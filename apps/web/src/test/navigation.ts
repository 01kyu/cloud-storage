import { vi } from "vitest";

/** Query-параметры текущего экрана: тесты выставляют их до рендера. */
export const searchParamsState: { current: URLSearchParams } = { current: new URLSearchParams() };

/** Навигация в jsdom: запоминаем параметры, чтобы `useSearchParams` вёл себя как в браузере. */
const applyLocation = (url: string): void => {
  const [, query = ""] = url.split("?");

  searchParamsState.current = new URLSearchParams(query);
};

/** В jsdom роутера нет, а тестам нужно проверять `replace`/`push`. */
export const routerMock = {
  push: vi.fn((url: string) => applyLocation(url)),
  replace: vi.fn((url: string) => applyLocation(url)),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const navigationState = { pathname: "/files" };

export const usePathname = (): string => navigationState.pathname;

export const useRouter = (): typeof routerMock => routerMock;

export const useSearchParams = (): URLSearchParams => searchParamsState.current;

export const resetNavigation = (): void => {
  navigationState.pathname = "/files";
  searchParamsState.current = new URLSearchParams();

  Object.values(routerMock).forEach((spy) => {
    spy.mockClear();
  });
};
