import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_PATH, API_ROUTES, type FileItem } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { useDownloadFile } from "./model/use-download-file";

const summaryFile = (): FileItem => {
  const file = getDb().files.find((item) => item.id === SEED_IDS.summary);

  if (!file) {
    throw new Error("Файл сидов не найден в моке");
  }

  return file;
};

/** jsdom не умеет object URL, поэтому подменяем только браузерную границу. */
const stubObjectUrl = () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:mock");
  const revokeObjectURL = vi.fn();

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: revokeObjectURL,
  });

  return { createObjectURL, revokeObjectURL };
};

const Harness = ({ file }: { file: FileItem }) => {
  const { download } = useDownloadFile();

  return (
    <button type="button" onClick={() => void download(file)}>
      Скачать
    </button>
  );
};

beforeEach(async () => {
  await signInAsDemo();
});

describe("useDownloadFile", () => {
  it("скачивает файл и сохраняет Blob под его именем", async () => {
    const user = userEvent.setup();
    const { createObjectURL, revokeObjectURL } = stubObjectUrl();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    renderWithProviders(<Harness file={summaryFile()} />);

    await user.click(screen.getByRole("button", { name: "Скачать" }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

    const blob = createObjectURL.mock.calls[0]?.[0];

    expect(blob?.size).toBeGreaterThan(0);
    expect(blob?.type).toBe("application/pdf");
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("показывает ошибку скачивания тостом и не создаёт ссылку", async () => {
    const user = userEvent.setup();
    const { createObjectURL } = stubObjectUrl();

    server.use(
      http.get(`${API_BASE_PATH}${API_ROUTES.files.download(":fileId")}`, () =>
        HttpResponse.json(
          { statusCode: 404, code: "NOT_FOUND", message: "Файл не найден" },
          { status: 404 },
        ),
      ),
    );

    renderWithProviders(<Harness file={summaryFile()} />);

    await user.click(screen.getByRole("button", { name: "Скачать" }));

    expect(await screen.findByText("Файл не найден")).toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("показывает запасную ошибку при сетевом сбое", async () => {
    const user = userEvent.setup();

    stubObjectUrl();
    server.use(
      http.get(`${API_BASE_PATH}${API_ROUTES.files.download(":fileId")}`, () =>
        HttpResponse.error(),
      ),
    );

    renderWithProviders(<Harness file={summaryFile()} />);

    await user.click(screen.getByRole("button", { name: "Скачать" }));

    // `baseQuery` ретраит `FETCH_ERROR` (ожидание старта MSW), поэтому ждём дольше.
    expect(
      await screen.findByText("Не удалось скачать файл. Попробуйте ещё раз", undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
  });
});
