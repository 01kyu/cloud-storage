"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";

import { useUploadFiles } from "../model/use-upload-files";

import styles from "./upload-dropzone.module.scss";

export type UploadDropzoneProps = {
  folderId: string | null;
  children: ReactNode;
};

/** Файлы из ОС приходят с MIME `Files`, перенос узлов — с `NODE_DRAG_MIME`. */
const hasFiles = (event: DragEvent<HTMLElement>): boolean =>
  event.dataTransfer.types.includes("Files");

/** Файлы, брошенные в проводник, грузятся в текущую папку; перенос узлов обрабатывают строки. */
export const UploadDropzone = ({ folderId, children }: UploadDropzoneProps) => {
  const { startUpload } = useUploadFiles(folderId);
  const [isDragging, setIsDragging] = useState(false);
  const depth = useRef(0);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>): void => {
    if (!hasFiles(event)) {
      return;
    }

    depth.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    if (!hasFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    if (!hasFiles(event)) {
      return;
    }

    depth.current = Math.max(depth.current - 1, 0);

    if (depth.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    if (!hasFiles(event)) {
      return;
    }

    event.preventDefault();
    depth.current = 0;
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);

    if (files.length > 0) {
      startUpload(files);
    }
  };

  return (
    <div
      className={styles.root}
      data-dragging={isDragging || undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isDragging ? (
        <div className={styles.overlay}>
          <span className={styles.hint}>Отпустите файлы, чтобы загрузить</span>
        </div>
      ) : null}
    </div>
  );
};
