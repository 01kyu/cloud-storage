"use client";

import { useSelector } from "react-redux";

import type { UploadQueueRootState } from "./upload-queue-slice";

export const useUploadQueueSelector = useSelector.withTypes<UploadQueueRootState>();
