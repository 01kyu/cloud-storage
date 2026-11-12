import type { ReactNode } from "react";
// Только типы: сами матчеры регистрируем через `expect.extend` (см. ниже).
import type {} from "@testing-library/jest-dom/vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect, vi } from "vitest";

import { resetDb } from "@shared/api/mocks";
import { resetToasts } from "@shared/ui";

import { server } from "./msw";
import { resetNavigation } from "./navigation";

/**
 * `@testing-library/jest-dom/vitest` не регистрирует матчеры в контексте тестов
 * в Vitest 5, поэтому расширяем `expect` явно.
 */
expect.extend(matchers);

/** В jsdom нет App Router, поэтому мокаем только границу фреймворка. */
vi.mock("next/link", async () => {
  const { createElement } = await import("react");

  type MockLinkProps = {
    href: unknown;
    children?: ReactNode;
  } & Record<string, unknown>;

  return {
    default: ({ href, children, ...rest }: MockLinkProps) =>
      createElement("a", { href: typeof href === "string" ? href : "#", ...rest }, children),
  };
});

vi.mock("next/navigation", () => import("./navigation"));

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb();
  resetToasts();
  resetNavigation();
});

afterAll(() => {
  server.close();
});

// jsdom не реализует API, которые используют Radix Primitives.
class ResizeObserverMock {
  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })),
});

Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn(() => false);
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
