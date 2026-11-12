import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES, type FileItem } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { useCopyFile } from "./model/use-copy-file";

const estimateFile = (): FileItem => {
  const file = getDb().files.find((item) => item.id === SEED_IDS.estimate);

  if (!file) {
    throw new Error("Файл сидов не найден в моке");
  }

  return file;
};

const Harness = ({ file }: { file: FileItem }) => {
  const { copy, isCopying } = useCopyFile();

  return (
    <button type="button" disabled={isCopying} onClick={() => void copy(file)}>
      Копировать
    </button>
  );
};

beforeEach(async () => {
  await signInAsDemo();
});

describe("useCopyFile", () => {
  it("копирует файл рядом с оригиналом и объявляет итоговое имя", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Harness file={estimateFile()} />);

    await user.click(screen.getByRole("button", { name: "Копировать" }));

    expect(await screen.findByText("Создана копия «Смета (копия).xlsx»")).toBeInTheDocument();

    const copies = getDb().files.filter((file) => file.name.startsWith("Смета (копия)"));

    expect(copies).toHaveLength(1);
  });

  it("показывает ошибку копирования тостом", async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_BASE_PATH}${API_ROUTES.files.copy(":fileId")}`, () =>
        HttpResponse.json(
          { statusCode: 413, code: "QUOTA_EXCEEDED", message: "Недостаточно свободного места" },
          { status: 413 },
        ),
      ),
    );

    renderWithProviders(<Harness file={estimateFile()} />);

    await user.click(screen.getByRole("button", { name: "Копировать" }));

    expect(await screen.findByText("Недостаточно свободного места")).toBeInTheDocument();
  });
});
