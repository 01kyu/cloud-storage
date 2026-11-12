import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { isAppleUserAgent, useIsApplePlatform } from "./use-platform";

const stubUserAgent = (userAgent: string): void => {
  Object.defineProperty(globalThis.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
};

afterEach(() => {
  Reflect.deleteProperty(globalThis.navigator, "userAgent");
});

describe("isAppleUserAgent", () => {
  it("узнаёт macOS и мобильные устройства Apple", () => {
    expect(isAppleUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(true);
    expect(isAppleUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(isAppleUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(true);
  });

  it("не считает Apple остальные платформы", () => {
    expect(isAppleUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    expect(isAppleUserAgent("Mozilla/5.0 (X11; Linux x86_64)")).toBe(false);
    expect(isAppleUserAgent("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
    expect(isAppleUserAgent("")).toBe(false);
  });
});

describe("useIsApplePlatform", () => {
  it("читает User-Agent браузера", () => {
    stubUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    expect(renderHook(() => useIsApplePlatform()).result.current).toBe(true);

    stubUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    expect(renderHook(() => useIsApplePlatform()).result.current).toBe(false);
  });
});
