import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const renderTabs = () =>
  render(
    <Tabs defaultValue="all">
      <TabsList aria-label="Фильтр файлов">
        <TabsTrigger value="all">Все</TabsTrigger>
        <TabsTrigger value="files">Файлы</TabsTrigger>
        <TabsTrigger value="folders">Папки</TabsTrigger>
      </TabsList>
      <TabsContent value="all">Все элементы</TabsContent>
      <TabsContent value="files">Только файлы</TabsContent>
      <TabsContent value="folders">Только папки</TabsContent>
    </Tabs>,
  );

describe("Tabs", () => {
  it("показывает активную вкладку и прячет остальные", () => {
    renderTabs();

    expect(screen.getByRole("tab", { name: "Все" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Все элементы")).toBeInTheDocument();
    expect(screen.queryByText("Только файлы")).not.toBeInTheDocument();
  });

  it("переключает вкладку кликом", async () => {
    const user = userEvent.setup();

    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Файлы" }));

    expect(screen.getByText("Только файлы")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Файлы" })).toHaveAttribute("aria-selected", "true");
  });

  it("переключает вкладку стрелками с клавиатуры", async () => {
    const user = userEvent.setup();

    renderTabs();

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Файлы" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Файлы" })).toHaveAttribute("aria-selected", "true");
  });
});
