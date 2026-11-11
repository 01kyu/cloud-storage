"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderPlus } from "lucide-react";
import { useForm } from "react-hook-form";

import { useCreateFolderMutation } from "@entities/folder";
import { getApiErrorMessage } from "@shared/lib";
import { Button, Field, Input, Modal, ModalContent } from "@shared/ui";

import { createFolderFormSchema, type CreateFolderFormValues } from "../model/create-folder-schema";

import styles from "./create-folder-button.module.scss";

const DEFAULT_VALUES: CreateFolderFormValues = { name: "" };

export type CreateFolderButtonProps = {
  parentId: string | null;
};

/** После успеха тег `Folder` инвалидируется — листинг и дерево обновляются сами. */
export const CreateFolderButton = ({ parentId }: CreateFolderButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createFolder, { isLoading }] = useCreateFolderMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFolderFormValues>({
    resolver: zodResolver(createFolderFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const openDialog = (): void => {
    setFormError(null);
    reset(DEFAULT_VALUES);
    setIsOpen(true);
  };

  const handleOpenChange = (nextOpen: boolean): void => {
    setIsOpen(nextOpen);

    if (!nextOpen) {
      setFormError(null);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await createFolder({ name: values.name, parentId }).unwrap();
      reset(DEFAULT_VALUES);
      setIsOpen(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Не удалось создать папку. Попробуйте ещё раз"));
    }
  });

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        iconLeft={<FolderPlus size={14} aria-hidden="true" />}
        onClick={openDialog}
      >
        Создать папку
      </Button>

      <Modal open={isOpen} onOpenChange={handleOpenChange}>
        <ModalContent
          title="Новая папка"
          description={
            parentId ? "Папка появится внутри текущей папки." : "Папка появится в корне хранилища."
          }
          size="sm"
        >
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <Field label="Название" error={errors.name?.message} required>
              <Input placeholder="Например, Договоры" {...register("name")} />
            </Field>

            {formError ? (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            ) : null}

            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" loading={isLoading || isSubmitting}>
                Создать
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
