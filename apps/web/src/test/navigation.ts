import { vi } from "vitest";

/** В jsdom роутера нет, а тестам нужно проверять `replace`/`push`. */
export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const navigationState = { pathname: "/files" };

export const usePathname = (): string => navigationState.pathname;

export const useRouter = (): typeof routerMock => routerMock;

export const resetNavigation = (): void => {
  navigationState.pathname = "/files";

  Object.values(routerMock).forEach((spy) => {
    spy.mockReset();
  });
};
