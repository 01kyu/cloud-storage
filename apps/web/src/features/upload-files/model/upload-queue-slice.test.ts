import { describe, expect, it } from "vitest";

import {
  initialUploadQueueState,
  isFinishedUpload,
  selectUploads,
  uploadCanceled,
  uploadDismissed,
  uploadFailed,
  uploadProgressed,
  uploadQueueReducer,
  uploadStarted,
  uploadSucceeded,
  uploadsCleared,
  uploadsQueued,
  type UploadQueueState,
} from "./upload-queue-slice";

const queueWith = (): UploadQueueState => ({
  items: [
    { id: "a", name: "a.txt", size: 10, progress: 0, status: "queued", error: null },
    { id: "b", name: "b.txt", size: 20, progress: 0, status: "queued", error: null },
  ],
});

const item = (state: UploadQueueState, id: string) => state.items.find((entry) => entry.id === id);

describe("uploadQueueSlice", () => {
  it("ставит файлы в очередь с нулевым прогрессом", () => {
    const state = uploadQueueReducer(
      initialUploadQueueState,
      uploadsQueued([{ id: "a", name: "a.txt", size: 10 }]),
    );

    expect(state.items).toEqual([
      { id: "a", name: "a.txt", size: 10, progress: 0, status: "queued", error: null },
    ]);
  });

  it("ведёт статус и прогресс, зажимая его в 0…100", () => {
    let state = uploadQueueReducer(queueWith(), uploadStarted("a"));

    state = uploadQueueReducer(state, uploadProgressed({ id: "a", progress: 140 }));

    expect(item(state, "a")).toMatchObject({ status: "uploading", progress: 100 });

    state = uploadQueueReducer(state, uploadProgressed({ id: "a", progress: -20 }));

    expect(item(state, "a")?.progress).toBe(0);

    state = uploadQueueReducer(state, uploadSucceeded("a"));

    expect(item(state, "a")).toMatchObject({ status: "succeeded", progress: 100 });
  });

  it("сохраняет ошибку и не откатывает завершённый элемент в canceled", () => {
    let state = uploadQueueReducer(queueWith(), uploadFailed({ id: "b", message: "Нет места" }));

    expect(item(state, "b")).toMatchObject({ status: "failed", error: "Нет места" });

    state = uploadQueueReducer(state, uploadCanceled("b"));

    expect(item(state, "b")?.status).toBe("failed");
  });

  it("убирает завершённые элементы и отдельные записи", () => {
    let state = uploadQueueReducer(queueWith(), uploadStarted("a"));

    state = uploadQueueReducer(state, uploadCanceled("b"));
    state = uploadQueueReducer(state, uploadsCleared());

    expect(state.items.map((entry) => entry.id)).toEqual(["a"]);

    state = uploadQueueReducer(state, uploadDismissed("a"));

    expect(state.items).toEqual([]);
  });

  it("отдаёт элементы через селектор и распознаёт финальные статусы", () => {
    const state = queueWith();

    expect(selectUploads({ uploadQueue: state })).toBe(state.items);
    expect(
      isFinishedUpload({
        id: "x",
        name: "x.txt",
        size: 0,
        progress: 100,
        status: "canceled",
        error: null,
      }),
    ).toBe(true);
    expect(
      isFinishedUpload({
        id: "y",
        name: "y.txt",
        size: 0,
        progress: 30,
        status: "uploading",
        error: null,
      }),
    ).toBe(false);
  });
});
