import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LIMITS } from "@cs/shared";

import { usePagedList } from "./use-paged-list";

type Props = { scope: string };

const renderPagedList = (scope: string) =>
  renderHook<ReturnType<typeof usePagedList>, Props>(
    ({ scope: current }) => usePagedList(current),
    {
      initialProps: { scope },
    },
  );

describe("usePagedList", () => {
  it("начинает с первой страницы и расширяет limit на шаг", () => {
    const { result } = renderPagedList("trash");

    expect(result.current.limit).toBe(LIMITS.pageSize);
    expect(result.current.canExpand).toBe(true);

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.limit).toBe(LIMITS.pageSize * 2);
  });

  it("не выходит за потолок контракта", () => {
    const { result } = renderPagedList("trash");

    act(() => {
      result.current.loadMore();
    });
    act(() => {
      result.current.loadMore();
    });

    expect(result.current.limit).toBe(LIMITS.maxPageSize);
    expect(result.current.canExpand).toBe(false);
  });

  it("начинает новую область с первой страницы", () => {
    const { result, rerender } = renderPagedList("root:name:asc");

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.limit).toBe(LIMITS.pageSize * 2);

    rerender({ scope: "folder-1:size:desc" });

    expect(result.current.limit).toBe(LIMITS.pageSize);
  });

  it("первый loadMore в новой области считает шаг от первой страницы", () => {
    const { result, rerender } = renderPagedList("root:name:asc");

    act(() => {
      result.current.loadMore();
    });
    rerender({ scope: "folder-1" });

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.limit).toBe(LIMITS.pageSize * 2);
  });
});
