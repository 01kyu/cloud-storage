import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { FolderTreeNode } from "../lib/build-tree";

import { FolderTree } from "./folder-tree";

const TREE: FolderTreeNode[] = [
  {
    id: "docs",
    name: "Документы",
    children: [{ id: "reports", name: "Отчёты", children: [] }],
  },
  { id: "music", name: "Музыка", children: [] },
];

describe("FolderTree", () => {
  it("превращает доменное дерево в ссылки на папки", () => {
    render(<FolderTree items={TREE} />);

    expect(screen.getByRole("navigation", { name: "Дерево папок" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "Документы" })).toHaveAttribute(
      "href",
      "/files/docs",
    );
    expect(screen.getByRole("treeitem", { name: "Отчёты" })).toHaveAttribute(
      "href",
      "/files/reports",
    );
    expect(screen.getByRole("button", { name: "Свернуть «Документы»" })).toBeInTheDocument();
  });

  it("помечает активную папку и не рендерит пустое дерево", () => {
    const { rerender, container } = render(<FolderTree items={TREE} activeId="reports" />);

    expect(screen.getByRole("treeitem", { name: "Отчёты" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    rerender(<FolderTree items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
