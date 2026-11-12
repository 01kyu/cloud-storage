"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { LIMITS, SharePermission, type Node, type Share } from "@cs/shared";
import { useCreateShareMutation } from "@entities/share";
import { ROUTES } from "@shared/config";
import { copyText, getApiErrorMessage, useOrigin } from "@shared/lib";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Modal,
  ModalContent,
  SegmentedControl,
  showErrorToast,
  showSuccessToast,
  type SegmentedControlOption,
} from "@shared/ui";

import { expiresAtFromNow } from "../lib/expires-at";
import {
  DEFAULT_CREATE_SHARE_VALUES,
  SHARE_EXPIRY,
  createShareFormSchema,
  type CreateShareFormValues,
} from "../model/create-share-schema";

import styles from "./share-node-dialog.module.scss";

const PERMISSION_OPTIONS: SegmentedControlOption[] = [
  { value: SharePermission.Read, label: "Просмотр" },
  { value: SharePermission.Download, label: "Скачивание" },
];

const EXPIRY_OPTIONS: SegmentedControlOption[] = [
  { value: SHARE_EXPIRY.never, label: "Бессрочно" },
  { value: SHARE_EXPIRY.day, label: "1 день" },
  { value: SHARE_EXPIRY.week, label: "7 дней" },
  { value: SHARE_EXPIRY.month, label: "30 дней" },
];

export type ShareNodeDialogProps = {
  /** `null` — диалог закрыт. */
  node: Node | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * После создания диалог превращается в карточку ссылки: адрес нужен сразу,
 * а `origin` известен только в браузере, поэтому ссылка собирается в `useOrigin`.
 */
export const ShareNodeDialog = ({ node, onOpenChange }: ShareNodeDialogProps) => {
  const [createShare, { isLoading }] = useCreateShareMutation();
  const [created, setCreated] = useState<Share | null>(null);
  const origin = useOrigin();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateShareFormValues>({
    resolver: zodResolver(createShareFormSchema),
    defaultValues: DEFAULT_CREATE_SHARE_VALUES,
  });
  const protectWithPassword = watch("protectWithPassword");

  useEffect(() => {
    if (node) {
      reset(DEFAULT_CREATE_SHARE_VALUES);
      setCreated(null);
    }
  }, [node, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!node) {
      return;
    }

    const expiresAt = expiresAtFromNow(values.expiresIn);

    try {
      const share = await createShare({
        nodeId: node.id,
        nodeType: node.type,
        permission: values.permission,
        ...(values.protectWithPassword ? { password: values.password.trim() } : {}),
        ...(expiresAt ? { expiresAt } : {}),
      }).unwrap();

      setCreated(share);
      showSuccessToast(`Ссылка на «${node.name}» создана`);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Не удалось создать ссылку. Попробуйте ещё раз"));
    }
  });

  const shareUrl = created ? `${origin}${ROUTES.publicShare(created.token)}` : "";

  const handleCopy = async (): Promise<void> => {
    const copied = await copyText(shareUrl);

    if (copied) {
      showSuccessToast("Ссылка скопирована");
      return;
    }

    showErrorToast("Не удалось скопировать ссылку — выделите адрес и скопируйте вручную");
  };

  return (
    <Modal open={node !== null} onOpenChange={onOpenChange}>
      <ModalContent
        size="sm"
        title={created ? "Ссылка готова" : "Поделиться"}
        description={
          created
            ? "Ссылку можно отозвать на странице «Общий доступ»."
            : node
              ? `Публичная ссылка на «${node.name}».`
              : undefined
        }
      >
        {created ? (
          <div className={styles.form}>
            <Field label="Публичная ссылка">
              <Input
                aria-label="Публичная ссылка"
                value={shareUrl}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
            </Field>

            <div className={styles.actions}>
              <Button
                variant="secondary"
                iconLeft={<Link2 size={14} aria-hidden="true" />}
                onClick={() => void handleCopy()}
              >
                Скопировать
              </Button>
              <Button onClick={() => onOpenChange(false)}>Готово</Button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={(event) => void onSubmit(event)} noValidate>
            <div className={styles.group}>
              <span className={styles.label}>Права доступа</span>
              <Controller
                name="permission"
                control={control}
                render={({ field }) => (
                  <SegmentedControl
                    aria-label="Права доступа"
                    options={PERMISSION_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className={styles.group}>
              <span className={styles.label}>Срок действия</span>
              <Controller
                name="expiresIn"
                control={control}
                render={({ field }) => (
                  <SegmentedControl
                    aria-label="Срок действия"
                    options={EXPIRY_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>

            <Controller
              name="protectWithPassword"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="Защитить паролем"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />

            {protectWithPassword ? (
              <Field
                label="Пароль"
                hint={`Минимум ${LIMITS.sharePasswordMinLength} символа`}
                error={errors.password?.message}
                required
              >
                <Input type="password" autoComplete="new-password" {...register("password")} />
              </Field>
            ) : null}

            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" loading={isLoading || isSubmitting}>
                Создать ссылку
              </Button>
            </div>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
};
