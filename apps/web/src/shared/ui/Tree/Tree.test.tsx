import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Tree, type TreeItem } from "./Tree";

const TREE: TreeItem[] = [
  {
    id: "docs",
    label: "Документы",
    href: "/files/docs",
    children: [
      { id: "reports", label: "Отчёты", href: "/files/reports", children: [] },
      { id: "contracts", label: "Договоры", href: "/files/contracts", children: [] },
    ],
  },
  { id: "music", label: "Музыка", href: "/files/music", children: [] },
];

const renderTree = (props: Partial<Parameters<typeof Tree>[0]> = {}) =>
  render(<Tree items={TREE} aria-label="Дерево папок" {...props} />);

const item = (name: string): HTMLElement => screen.getByRole("treeitem", { name });

describe("Tree", () => {
  it("рендерит дерево элементами с уровнями вложенности", () => {
    renderTree();

    expect(screen.getByRole("navigation", { name: "Дерево папок" })).toBeInTheDocument();
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(item("Документы")).toHaveAttribute("href", "/files/docs");
    expect(item("Документы")).toHaveAttribute("aria-level", "1");
    expect(item("Отчёты")).toHaveAttribute("aria-level", "2");
    expect(screen.getAllByRole("treeitem")).toHaveLength(4);
  });

  it("не рендерит пустое дерево", () => {
    const { container } = render(<Tree items={[]} aria-label="Дерево папок" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("сворачивает и разворачивает узел кнопкой", async () => {
    const user = userEvent.setup();

    renderTree();

    const toggle = screen.getByRole("button", { name: "Свернуть «Документы»" });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("tabindex", "-1");

    await user.click(toggle);

    expect(screen.queryByRole("treeitem", { name: "Отчёты" })).not.toBeInTheDocument();
    expect(item("Документы")).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Развернуть «Документы»" }));

    expect(item("Отчёты")).toBeInTheDocument();
  });

  it("не показывает кнопку для узла без детей", () => {
    renderTree();

    expect(screen.queryByRole("button", { name: "Свернуть «Музыка»" })).not.toBeInTheDocument();
    expect(item("Музыка")).not.toHaveAttribute("aria-expanded");
  });

  it("помечает активный узел aria-selected и aria-current", () => {
    renderTree({ activeId: "reports" });

    expect(item("Отчёты")).toHaveAttribute("aria-selected", "true");
    expect(item("Отчёты")).toHaveAttribute("aria-current", "page");
    expect(item("Документы")).toHaveAttribute("aria-selected", "false");
    expect(item("Документы")).not.toHaveAttribute("aria-current");
  });

  it("держит в tab-порядке только один узел", async () => {
    const user = userEvent.setup();

    renderTree();

    const tabbable = screen
      .getAllByRole("treeitem")
      .filter((node) => node.getAttribute("tabindex") === "0");

    expect(tabbable).toHaveLength(1);

    await user.tab();

    expect(item("Документы")).toHaveFocus();

    await user.keyboard("{ArrowDown}");

    expect(item("Отчёты")).toHaveFocus();
    expect(
      screen.getAllByRole("treeitem").filter((node) => node.getAttribute("tabindex") === "0"),
    ).toHaveLength(1);
  });

  it("ходит по дереву стрелками и краями списка", async () => {
    const user = userEvent.setup();

    renderTree();

    item("Документы").focus();

    await user.keyboard("{ArrowDown}");

    expect(item("Отчёты")).toHaveFocus();

    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(item("Музыка")).toHaveFocus();

    await user.keyboard("{ArrowDown}");

    expect(item("Музыка")).toHaveFocus();

    await user.keyboard("{Home}");

    expect(item("Документы")).toHaveFocus();

    await user.keyboard("{End}{ArrowUp}");

    expect(item("Договоры")).toHaveFocus();
  });

  it("разворачивает узел и переходит к ребёнку стрелкой вправо", async () => {
    const user = userEvent.setup();

    renderTree({ defaultExpandedIds: [] });

    expect(screen.queryByRole("treeitem", { name: "Отчёты" })).not.toBeInTheDocument();

    item("Документы").focus();
    await user.keyboard("{ArrowRight}");

    expect(item("Отчёты")).toBeInTheDocument();
    expect(item("Документы")).toHaveFocus();

    await user.keyboard("{ArrowRight}");

    expect(item("Отчёты")).toHaveFocus();
  });

  it("сворачивает узел и поднимается к родителю стрелкой влево", async () => {
    const user = userEvent.setup();

    renderTree();

    item("Отчёты").focus();
    await user.keyboard("{ArrowLeft}");

    expect(item("Документы")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");

    expect(screen.queryByRole("treeitem", { name: "Отчёты" })).not.toBeInTheDocument();
    expect(item("Документы")).toHaveFocus();
  });

  it("рендерит узел без ссылки, иконки и текстовой метки", () => {
    render(
      <Tree
        aria-label="Дерево папок"
        items={[
          {
            id: "group",
            label: <em>Группа</em>,
            children: [{ id: "child", label: "Ребёнок" }],
          },
          { id: "note", label: <em>Заметки</em> },
        ]}
      />,
    );

    const note = item("Заметки");

    expect(note.tagName).toBe("SPAN");
    expect(note).not.toHaveAttribute("href");
    expect(note).not.toHaveAttribute("aria-expanded");
    expect(note).not.toHaveAttribute("aria-current");
    expect(note.querySelector("svg")).toBeNull();
    expect(screen.getByRole("button", { name: "Свернуть" })).toBeInTheDocument();
  });

  it("игнорирует клавиши вне узлов, на листьях и на неизвестных клавишах", async () => {
    const user = userEvent.setup();

    renderTree();

    const toggle = screen.getByRole("button", { name: "Свернуть «Документы»" });

    toggle.focus();
    await user.keyboard("{ArrowDown}");

    expect(toggle).toHaveFocus();

    item("Музыка").focus();
    await user.keyboard("{ArrowRight}");

    expect(item("Музыка")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");

    expect(item("Музыка")).toHaveFocus();

    await user.keyboard("a");

    expect(item("Музыка")).toHaveFocus();
  });

  it("работает пикером: узел без href становится кнопкой и отдаёт id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <Tree
        aria-label="Папка назначения"
        onSelect={onSelect}
        items={[{ id: "docs", label: "Документы", children: [{ id: "reports", label: "Отчёты" }] }]}
      />,
    );

    const reports = item("Отчёты");

    expect(reports.tagName).toBe("BUTTON");
    expect(reports).toHaveAttribute("aria-level", "2");
    expect(reports).toHaveAttribute("aria-selected", "false");

    await user.click(reports);

    expect(onSelect).toHaveBeenCalledWith("reports");

    reports.focus();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});
