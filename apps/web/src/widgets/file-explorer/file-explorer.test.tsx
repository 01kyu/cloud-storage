import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { routerMock, searchParamsState } from "../../test/navigation";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { FileExplorer } from "./file-explorer";

beforeEach(async () => {
  await signInAsDemo();
});

const nodeTexts = (container: HTMLElement, view: "list" | "grid" = "list"): string[] =>
  Array.from(container.querySelectorAll(`[data-view="${view}"] > li`)).map(
    (item) => item.textContent ?? "",
  );

const openSortMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /Сортировка: / }));
};

describe("FileExplorer", () => {
  it("показывает папки и файлы корня из мока", async () => {
    renderWithProviders(<FileExplorer folderId={null} />);

    expect(await screen.findByRole("heading", { name: "Все файлы" })).toBeInTheDocument();

    const documentsLink = await screen.findByRole("link", { name: /Документы/ });

    expect(documentsLink).toHaveAttribute("href", `/files/${SEED_IDS.documents}`);
    expect(await screen.findByText("Резюме.pdf")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Резюме/ })).not.toBeInTheDocument();
  });

  it("показывает содержимое вложенной папки и хлебные крошки", async () => {
    renderWithProviders(<FileExplorer folderId={SEED_IDS.reports} />);

    expect(await screen.findByRole("heading", { name: "Отчёты" })).toBeInTheDocument();
    expect(await screen.findByText("Смета.xlsx")).toBeInTheDocument();

    const breadcrumbs = screen.getByRole("navigation", { name: "Хлебные крошки" });

    expect(within(breadcrumbs).getByRole("link", { name: "Документы" })).toHaveAttribute(
      "href",
      `/files/${SEED_IDS.documents}`,
    );
    expect(within(breadcrumbs).getByRole("link", { name: "Отчёты" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("показывает пустое состояние для папки без файлов", async () => {
    renderWithProviders(<FileExplorer folderId={SEED_IDS.emptyFolder} />);

    expect(await screen.findByText("В папке пусто")).toBeInTheDocument();
  });

  it("показывает ошибку с повтором для несуществующей папки", async () => {
    renderWithProviders(<FileExplorer folderId="ffffffff-0000-4000-8000-000000000000" />);

    expect(await screen.findByText("Не удалось загрузить папку")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
  });

  it("применяет режим и сортировку из URL", async () => {
    searchParamsState.current = new URLSearchParams("view=grid&sort=size:desc");

    const { container } = renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });

    expect(container.querySelector('[data-view="grid"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сортировка: Размер" })).toBeInTheDocument();
  });

  it("пишет режим в URL и не дублирует дефолты", async () => {
    const user = userEvent.setup();

    renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });
    await user.click(screen.getByRole("radio", { name: "Сетка" }));

    expect(routerMock.replace).toHaveBeenCalledWith("/files?view=grid", { scroll: false });

    await user.click(screen.getByRole("radio", { name: "Список" }));

    expect(screen.getByRole("radio", { name: "Список" })).toHaveAttribute("data-state", "on");
    expect(routerMock.replace).toHaveBeenLastCalledWith("/files", { scroll: false });
  });

  it("переключает листинг в режим сетки", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });

    expect(container.querySelector('[data-view="list"]')).toBeInTheDocument();
    expect(container.querySelector('[data-view="grid"]')).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Сетка" }));

    expect(container.querySelector('[data-view="grid"]')).toBeInTheDocument();
    expect(container.querySelector('[data-view="list"]')).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Документы/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Сетка" })).toHaveAttribute("data-state", "on");
  });

  it("сортирует по размеру без мигания скелетона", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });

    expect(nodeTexts(container)[0]).toContain("Документы");

    await openSortMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: "Размер" }));

    expect(screen.queryByLabelText("Загрузка содержимого")).not.toBeInTheDocument();
    await waitFor(() => expect(nodeTexts(container)[0]).toContain("Пустая папка"));
    expect(screen.getByRole("button", { name: "Сортировка: Размер" })).toBeInTheDocument();
  });

  it("меняет направление сортировки по имени", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });

    await openSortMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: "По убыванию" }));

    await waitFor(() => expect(nodeTexts(container)[0]).toContain("Фотографии"));

    await openSortMenu(user);

    expect(screen.getByRole("menuitemradio", { name: "По убыванию" })).toBeChecked();
  });

  it("сортирует карточки сетки тем же параметром", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });
    await user.click(screen.getByRole("radio", { name: "Сетка" }));

    await openSortMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: "Размер" }));

    await waitFor(() => expect(nodeTexts(container, "grid")[0]).toContain("Пустая папка"));
  });

  it("добавляет созданную папку в листинг", async () => {
    const user = userEvent.setup();

    renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });
    await user.click(screen.getByRole("button", { name: "Создать папку" }));
    await user.type(await screen.findByLabelText(/Название/), "Проекты");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    const createdLink = await screen.findByRole("link", { name: /Проекты/ });

    expect(createdLink.getAttribute("href")).toMatch(/^\/files\/[0-9a-f-]{36}$/);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("обновляет листинг по кнопке", async () => {
    const user = userEvent.setup();

    renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });
    await user.click(screen.getByRole("button", { name: "Обновить" }));

    expect(await screen.findByRole("link", { name: /Документы/ })).toBeInTheDocument();
  });

  it("повторяет запрос по кнопке «Повторить»", async () => {
    const user = userEvent.setup();

    renderWithProviders(<FileExplorer folderId="ffffffff-0000-4000-8000-000000000000" />);

    await screen.findByText("Не удалось загрузить папку");
    await user.click(screen.getByRole("button", { name: "Повторить" }));

    expect(await screen.findByText("Не удалось загрузить папку")).toBeInTheDocument();
  });

  it("показывает пустое состояние корня", async () => {
    server.use(
      http.get(`${API_BASE_PATH}${API_ROUTES.folders.root}`, () =>
        HttpResponse.json({ items: [], nextCursor: null }),
      ),
    );

    renderWithProviders(<FileExplorer folderId={null} />);

    expect(await screen.findByText("Файлов пока нет")).toBeInTheDocument();
  });

  it("открывает контекстное меню по правому клику", async () => {
    renderWithProviders(<FileExplorer folderId={null} />);

    fireEvent.contextMenu(await screen.findByText("Резюме.pdf"), { button: 2 });

    expect(await screen.findByRole("menuitem", { name: "Скачать" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Переименовать" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Переместить" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Удалить" })).toBeInTheDocument();
  });

  it("переименовывает файл через меню строки", async () => {
    const user = userEvent.setup();

    renderWithProviders(<FileExplorer folderId={null} />);

    await user.click(await screen.findByRole("button", { name: "Действия: Резюме.pdf" }));
    await user.click(await screen.findByRole("menuitem", { name: "Переименовать" }));

    const input = await screen.findByLabelText(/Название/);

    await user.clear(input);
    await user.type(input, "Резюме 2027.pdf");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Резюме 2027.pdf")).toBeInTheDocument();
    expect(screen.queryByText("Резюме.pdf")).not.toBeInTheDocument();
  });

  it("копирует файл через меню строки", async () => {
    const user = userEvent.setup();

    renderWithProviders(<FileExplorer folderId={null} />);

    await user.click(await screen.findByRole("button", { name: "Действия: Резюме.pdf" }));
    await user.click(await screen.findByRole("menuitem", { name: "Копировать" }));

    expect(await screen.findByText("Резюме (копия).pdf")).toBeInTheDocument();
    // Тост объявляется ещё и в `aria-live`-регионе, поэтому берём точное совпадение.
    expect(
      screen.getByText("Создана копия «Резюме (копия).pdf»", { exact: true }),
    ).toBeInTheDocument();
    expect(getDb().files.filter((file) => file.name === "Резюме (копия).pdf")).toHaveLength(1);
  });

  it("удаляет файл в корзину через меню строки", async () => {
    const user = userEvent.setup();

    renderWithProviders(<FileExplorer folderId={null} />);

    await user.click(await screen.findByRole("button", { name: "Действия: Резюме.pdf" }));
    await user.click(await screen.findByRole("menuitem", { name: "Удалить" }));
    await user.click(await screen.findByRole("button", { name: "Удалить" }));

    await waitFor(() => expect(screen.queryByText("Резюме.pdf")).not.toBeInTheDocument());
    expect(getDb().trash.some((item) => item.id === SEED_IDS.resume)).toBe(true);
  });

  it("подсвечивает объект и совпадение в имени при возврате из поиска", async () => {
    const { container } = renderWithProviders(
      <FileExplorer folderId={null} highlightNodeId={SEED_IDS.resume} highlightQuery="Резю" />,
    );

    await screen.findByRole("link", { name: /Документы/ });

    const row = container.querySelector(`#node-${SEED_IDS.resume}`);

    expect(row).not.toBeNull();
    expect(row?.querySelector("mark")).toHaveTextContent("Резю");
    expect(row?.querySelector("mark")?.closest("[class*='highlighted']")).not.toBeNull();
  });

  it("переносит файл в папку перетаскиванием", async () => {
    renderWithProviders(<FileExplorer folderId={null} />);

    const fileRow = (await screen.findByText("Резюме.pdf")).closest("[draggable='true']");
    const folderLink = await screen.findByRole("link", { name: /Документы/ });
    const dataTransfer = {
      types: ["application/x-cs-node"],
      effectAllowed: "",
      dropEffect: "",
      setData: vi.fn(),
      getData: () => JSON.stringify({ id: SEED_IDS.resume, type: "file" }),
    };

    expect(fileRow).not.toBeNull();

    fireEvent.dragStart(fileRow as HTMLElement, { dataTransfer });
    fireEvent.dragOver(folderLink, { dataTransfer });
    fireEvent.drop(folderLink, { dataTransfer });

    await waitFor(() =>
      expect(getDb().files.find((file) => file.id === SEED_IDS.resume)?.folderId).toBe(
        SEED_IDS.documents,
      ),
    );
    await waitFor(() => expect(screen.queryByText("Резюме.pdf")).not.toBeInTheDocument());
  });

  it("загружает файл через кнопку тулбара", async () => {
    const { container } = renderWithProviders(<FileExplorer folderId={null} />);

    await screen.findByRole("link", { name: /Документы/ });

    fireEvent.change(screen.getByLabelText("Выбрать файлы для загрузки"), {
      target: { files: [new File(["данные"], "Новый.txt", { type: "text/plain" })] },
    });

    await waitFor(() => {
      const list = container.querySelector('[data-view="list"]');

      expect(list).not.toBeNull();
      expect(list).toHaveTextContent("Новый.txt");
    });
    expect(await screen.findByText(/Готово/)).toBeInTheDocument();
  });
});
