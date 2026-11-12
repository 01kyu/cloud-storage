import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoadMore } from "./LoadMore";

describe("LoadMore", () => {
  it("показывает счётчик и кнопку, когда есть ещё", () => {
    render(<LoadMore hasMore loadedCount={50} onLoadMore={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Показано 50");
    expect(screen.getByRole("button", { name: "Показать ещё" })).toBeEnabled();
  });

  it("зовёт onLoadMore по клику", async () => {
    const onLoadMore = vi.fn();
    const user = userEvent.setup();

    render(<LoadMore hasMore loadedCount={50} onLoadMore={onLoadMore} />);
    await user.click(screen.getByRole("button", { name: "Показать ещё" }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("прячется, когда страниц больше нет", () => {
    render(<LoadMore hasMore={false} loadedCount={12} onLoadMore={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Показать ещё" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("блокирует кнопку на время загрузки", () => {
    render(<LoadMore hasMore loadedCount={50} loading onLoadMore={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Показать ещё" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
