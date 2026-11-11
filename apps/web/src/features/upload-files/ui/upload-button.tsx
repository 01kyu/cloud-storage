"use client";

import { useRef, type ChangeEvent } from "react";
import { Upload } from "lucide-react";

import { Button } from "@shared/ui";

import { useUploadFiles } from "../model/use-upload-files";

import styles from "./upload-button.module.scss";

export type UploadButtonProps = {
  folderId: string | null;
};

export const UploadButton = ({ folderId }: UploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadFiles(folderId);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      startUpload(files);
    }

    // Сброс значения: тот же файл можно выбрать повторно.
    event.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        multiple
        aria-label="Выбрать файлы для загрузки"
        onChange={handleChange}
      />
      <Button
        variant="secondary"
        size="sm"
        loading={isUploading}
        iconLeft={<Upload size={14} aria-hidden="true" />}
        onClick={() => inputRef.current?.click()}
      >
        Загрузить
      </Button>
    </>
  );
};
