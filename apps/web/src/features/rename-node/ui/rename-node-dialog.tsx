"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { NodeType, type Node } from "@cs/shared";
import { useRenameFileMutation } from "@entities/file";
import { useRenameFolderMutation } from "@entities/folder";
import { getApiErrorMessage } from "@shared/lib";
import { Button, Field, Input, Modal, ModalContent } from "@shared/ui";

import { renameNodeFormSchema, type RenameNodeFormValues } from "../model/rename-node-schema";

import styles from "./rename-node-dialog.module.scss";

export type RenameNodeDialogProps = {
  /** `null` — диалог закрыт. */
  node: Node | null;
  onOpenChange: (open: boolean) => void;
};

const DEFAULT_VALUES: RenameNodeFormValues = { name: "" };

/** Ошибка 409 остаётся в диалоге — имя можно поправить на месте. */
export const RenameNodeDialog = ({ node, onOpenChange }: RenameNodeDialogProps) => {
  const [renameFile, { isLoading: isFileRenaming }] = useRenameFileMutation();
  const [renameFolder, { isLoading: isFolderRenaming }] = useRenameFolderMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RenameNodeFormValues>({
    resolver: zodResolver(renameNodeFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (node) {
      reset({ name: node.name });
      setFormError(null);
    }
  }, [node, reset]);

  const handleOpenChange = (nextOpen: boolean): void => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setFormError(null);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!node) {
      return;
    }

    setFormError(null);

    try {
      if (node.type === NodeType.File) {
        await renameFile({ fileId: node.id, name: values.name }).unwrap();
      } else {
        await renameFolder({ folderId: node.id, name: values.name }).unwrap();
      }

      handleOpenChange(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Не удалось переименовать. Попробуйте ещё раз"));
    }
  });

  return (
    <Modal open={node !== null} onOpenChange={handleOpenChange}>
      <ModalContent
        size="sm"
        title="Переименовать"
        description={node ? `Новое имя для «${node.name}»` : undefined}
      >
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <Field label="Название" error={errors.name?.message} required>
            <Input {...register("name")} />
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
            <Button type="submit" loading={isFileRenaming || isFolderRenaming || isSubmitting}>
              Сохранить
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
};
