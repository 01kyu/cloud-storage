import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchTrigger } from "./search-trigger";

const stubUserAgent = (userAgent: string): void => {
  Object.defineProperty(globalThis.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
};

afterEach(() => {
  Reflect.deleteProperty(globalThis.navigator, "userAgent");
});

describe("SearchTrigger", () => {
  it("на Windows и Linux подписывает хоткей «Ctrl K»", () => {
    stubUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    render(<SearchTrigger onClick={vi.fn()} />);

    expect(screen.getByText("Ctrl K")).toBeInTheDocument();
  });

  it("на macOS подписывает хоткей «⌘ K»", () => {
    stubUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");

    render(<SearchTrigger onClick={vi.fn()} />);

    expect(screen.getByText("\u2318 K")).toBeInTheDocument();
  });
});
