import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UploadStatus = "queued" | "uploading" | "succeeded" | "failed" | "canceled";

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  error: string | null;
};

export type UploadQueueState = {
  items: UploadItem[];
};

export const initialUploadQueueState: UploadQueueState = { items: [] };

const FINISHED_STATUSES: UploadStatus[] = ["succeeded", "failed", "canceled"];

export const isFinishedUpload = (item: UploadItem): boolean =>
  FINISHED_STATUSES.includes(item.status);

const findItem = (state: UploadQueueState, id: string): UploadItem | undefined =>
  state.items.find((item) => item.id === id);

/** Очередь переживает перемонтирование тулбара, поэтому живёт в Redux. */
const uploadQueueSlice = createSlice({
  name: "uploadQueue",
  initialState: initialUploadQueueState,
  reducers: {
    uploadsQueued(state, action: PayloadAction<{ id: string; name: string; size: number }[]>) {
      action.payload.forEach((file) => {
        state.items.push({ ...file, progress: 0, status: "queued", error: null });
      });
    },

    uploadStarted(state, action: PayloadAction<string>) {
      const item = findItem(state, action.payload);

      if (item) {
        item.status = "uploading";
        item.progress = 0;
        item.error = null;
      }
    },

    uploadProgressed(state, action: PayloadAction<{ id: string; progress: number }>) {
      const item = findItem(state, action.payload.id);

      if (item) {
        item.progress = Math.min(Math.max(action.payload.progress, 0), 100);
      }
    },

    uploadSucceeded(state, action: PayloadAction<string>) {
      const item = findItem(state, action.payload);

      if (item) {
        item.status = "succeeded";
        item.progress = 100;
      }
    },

    uploadFailed(state, action: PayloadAction<{ id: string; message: string }>) {
      const item = findItem(state, action.payload.id);

      if (item) {
        item.status = "failed";
        item.error = action.payload.message;
      }
    },

    uploadCanceled(state, action: PayloadAction<string>) {
      const item = findItem(state, action.payload);

      if (item && !isFinishedUpload(item)) {
        item.status = "canceled";
      }
    },

    uploadDismissed(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    uploadsCleared(state) {
      state.items = state.items.filter((item) => !isFinishedUpload(item));
    },
  },
});

export const {
  uploadCanceled,
  uploadDismissed,
  uploadFailed,
  uploadProgressed,
  uploadSucceeded,
  uploadStarted,
  uploadsCleared,
  uploadsQueued,
} = uploadQueueSlice.actions;

export const uploadQueueReducer = uploadQueueSlice.reducer;

/** Минимальный срез стора для фичи: без импорта `RootState` из `app`. */
export type UploadQueueRootState = {
  uploadQueue: UploadQueueState;
};

export const selectUploads = (state: UploadQueueRootState): UploadItem[] => state.uploadQueue.items;
