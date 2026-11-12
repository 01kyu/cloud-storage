import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./use-debounce";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("сразу отдаёт исходное значение", () => {
    const { result } = renderHook(() => useDebouncedValue("ab", 300));

    expect(result.current).toBe("ab");
  });

  it("обновляет значение только после паузы", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: "ab" } },
    );

    rerender({ value: "abc" });

    expect(result.current).toBe("ab");

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe("ab");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("abc");
  });

  it("сбрасывает таймер при быстром вводе и не отдаёт промежуточные значения", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: "ab" } },
    );

    rerender({ value: "abc" });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "abcd" });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current).toBe("ab");

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current).toBe("abcd");
  });

  it("отменяет таймер при размонтировании", () => {
    const { unmount } = renderHook(() => useDebouncedValue("ab", 300));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
