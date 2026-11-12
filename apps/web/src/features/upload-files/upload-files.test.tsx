import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { UploadButton } from "./ui/upload-button";
import { UploadDropzone } from "./ui/upload-dropzone";
import { UploadQueue } from "./ui/upload-queue";

const makeFile = (name: string, content = "данные"): File =>
  new File([content], name, { type: "text/plain" });

const selectFiles = (files: File[]): void => {
  fireEvent.change(screen.getByLabelText("Выбрать файлы для загрузки"), { target: { files } });
};

const fileByName = (name: string) => getDb().files.find((file) => file.name === name);

const renderUploader = (folderId: string | null = null) =>
  renderWithProviders(
    <>
      <UploadButton folderId={folderId} />
      <UploadQueue />
    </>,
  );

beforeEach(async () => {
  await signInAsDemo();
});

describe("UploadButton и UploadQueue", () => {
  it("загружает файл и показывает завершённую очередь", async () => {
    renderUploader();

    selectFiles([makeFile("Отчёт.txt", "текст")]);

    expect(await screen.findByText(/Готово/)).toBeInTheDocument();
    await waitFor(() =>
      expect(fileByName("Отчёт.txt")).toMatchObject({ status: "ready", size: 10 }),
    );
    expect(fileByName("Отчёт.txt")?.checksum).toHaveLength(64);

    const removeButton = await screen.findByRole("button", {
      name: "Убрать «Отчёт.txt» из очереди",
    });

    await userEvent.setup().click(removeButton);

    expect(screen.queryByRole("region", { name: "Очередь загрузки" })).not.toBeInTheDocument();
  });

  it("загружает файл в текущую папку", async () => {
    renderUploader(SEED_IDS.emptyFolder);

    selectFiles([makeFile("В папке.txt")]);

    await waitFor(() =>
      expect(fileByName("В папке.txt")).toMatchObject({
        folderId: SEED_IDS.emptyFolder,
        status: "ready",
      }),
    );
  });

  it("показывает ошибку сервера и не создаёт файл", async () => {
    server.use(
      http.post(`${API_BASE_PATH}${API_ROUTES.files.uploadInit}`, () =>
        HttpResponse.json(
          { statusCode: 409, code: "CONFLICT", message: "Файл с таким именем уже существует" },
          { status: 409 },
        ),
      ),
    );

    renderUploader();

    selectFiles([makeFile("Дубль.txt")]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Файл с таким именем уже существует",
    );
    expect(fileByName("Дубль.txt")).toBeUndefined();
    expect(screen.getByText(/Ошибка/)).toBeInTheDocument();
  });

  it("отменяет активную загрузку и не доводит файл до ready", async () => {
    server.use(
      http.put(`${API_BASE_PATH}/mock-upload/:fileId`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();

    renderUploader();
    selectFiles([makeFile("Отмена.txt")]);

    await user.click(await screen.findByRole("button", { name: "Отменить загрузку «Отмена.txt»" }));

    expect(await screen.findByText(/Отменено/)).toBeInTheDocument();
    expect(fileByName("Отмена.txt")?.status).not.toBe("ready");
  });
});

describe("UploadDropzone", () => {
  it("загружает файлы, брошенные в проводник", async () => {
    renderWithProviders(
      <UploadDropzone folderId={null}>
        <p>Содержимое папки</p>
      </UploadDropzone>,
    );

    const zone = screen.getByText("Содержимое папки").parentElement;
    const dataTransfer = {
      types: ["Files"],
      files: [makeFile("Брошенный.txt")],
      dropEffect: "",
    };

    expect(zone).not.toBeNull();

    fireEvent.dragEnter(zone as HTMLElement, { dataTransfer });

    expect(screen.getByText("Отпустите файлы, чтобы загрузить")).toBeInTheDocument();

    fireEvent.drop(zone as HTMLElement, { dataTransfer });

    // Цепочка init → PUT тела → complete идёт через MSW: под инструментацией
    // покрытия она иногда не укладывается в дефолтную секунду `waitFor`.
    await waitFor(() => expect(fileByName("Брошенный.txt")?.status).toBe("ready"), {
      timeout: 3000,
    });
    expect(screen.queryByText("Отпустите файлы, чтобы загрузить")).not.toBeInTheDocument();
  });

  it("игнорирует перенос узлов хранилища", () => {
    renderWithProviders(
      <UploadDropzone folderId={null}>
        <p>Содержимое папки</p>
      </UploadDropzone>,
    );

    const zone = screen.getByText("Содержимое папки").parentElement as HTMLElement;

    fireEvent.dragEnter(zone, { dataTransfer: { types: ["application/x-cs-node"] } });

    expect(screen.queryByText("Отпустите файлы, чтобы загрузить")).not.toBeInTheDocument();
  });
});
