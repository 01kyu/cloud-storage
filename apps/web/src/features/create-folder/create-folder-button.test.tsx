import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { CreateFolderButton } from "./ui/create-folder-button";

beforeEach(async () => {
  await signInAsDemo();
});

const foldersWithName = (name: string) => getDb().folders.filter((folder) => folder.name === name);

const openDialog = async (parentId: string | null = null) => {
  const user = userEvent.setup();

  renderWithProviders(<CreateFolderButton parentId={parentId} />);

  await user.click(screen.getByRole("button", { name: "Создать папку" }));

  return { user, dialog: await screen.findByRole("dialog") };
};

describe("CreateFolderButton", () => {
  it("создаёт папку в корне и закрывает модалку", async () => {
    const { user } = await openDialog();

    await user.type(screen.getByLabelText(/Название/), "Проекты");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(foldersWithName("Проекты")).toHaveLength(1);
    expect(foldersWithName("Проекты")[0]).toMatchObject({ parentId: null, depth: 0 });
  });

  it("создаёт папку внутри текущей папки", async () => {
    const { user } = await openDialog(SEED_IDS.documents);

    await user.type(screen.getByLabelText(/Название/), "Сметы 2027");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(foldersWithName("Сметы 2027")[0]).toMatchObject({
      parentId: SEED_IDS.documents,
      depth: 1,
    });
  });

  it("показывает ошибку 409 для дубликата и оставляет модалку открытой", async () => {
    const { user } = await openDialog();

    await user.type(screen.getByLabelText(/Название/), "Документы");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Папка с таким именем уже существует",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("не отправляет запрос с пустым названием", async () => {
    const { user } = await openDialog();

    const foldersBefore = getDb().folders.length;

    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(await screen.findByText("Введите название папки")).toBeInTheDocument();
    expect(getDb().folders).toHaveLength(foldersBefore);
  });

  it("закрывает модалку по кнопке «Отмена»", async () => {
    const { user } = await openDialog();

    await user.type(screen.getByLabelText(/Название/), "Черновик");
    await user.click(screen.getByRole("button", { name: "Отмена" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(foldersWithName("Черновик")).toHaveLength(0);
  });

  it("показывает запасную ошибку при сетевом сбое", async () => {
    server.use(
      http.post(`${API_BASE_PATH}${API_ROUTES.folders.create}`, () => HttpResponse.error()),
    );

    const { user } = await openDialog();

    await user.type(screen.getByLabelText(/Название/), "Проекты");
    await user.click(screen.getByRole("button", { name: "Создать" }));

    // `baseQuery` ретраит `FETCH_ERROR` (ожидание старта MSW), поэтому ждём дольше.
    expect(await screen.findByRole("alert", undefined, { timeout: 3000 })).toHaveTextContent(
      "Не удалось создать папку. Попробуйте ещё раз",
    );
  });
});
