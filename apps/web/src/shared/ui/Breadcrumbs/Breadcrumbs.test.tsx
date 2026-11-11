import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

const ITEMS: BreadcrumbItem[] = [
  { id: "root", label: "Хранилище", href: "/files" },
  { id: "photos", label: "Фотографии", href: "/files/photos" },
  { id: "2026", label: "2026", href: "/files/2026" },
];

describe("Breadcrumbs", () => {
  it("рендерит цепочку ссылок от корня к текущей папке", () => {
    render(<Breadcrumbs items={ITEMS} />);

    expect(screen.getByRole("navigation", { name: "Хлебные крошки" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Хранилище" })).toHaveAttribute("href", "/files");
    expect(screen.getByRole("link", { name: "2026" })).toHaveAttribute("href", "/files/2026");
    expect(screen.getAllByRole("listitem")).toHaveLength(ITEMS.length);
  });

  it("помечает текущую крошку через aria-current", () => {
    render(<Breadcrumbs items={ITEMS} />);

    expect(screen.getByRole("link", { name: "2026" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Фотографии" })).not.toHaveAttribute("aria-current");
  });

  it("поддерживает свой aria-label и не рендерит пустую цепочку", () => {
    const { container, rerender } = render(<Breadcrumbs items={ITEMS} aria-label="Путь к папке" />);

    expect(screen.getByRole("navigation", { name: "Путь к папке" })).toBeInTheDocument();

    rerender(<Breadcrumbs items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
