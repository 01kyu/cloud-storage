"use client";

import { Copy } from "lucide-react";

import { copyText } from "@shared/lib";
import { Button, showErrorToast, showSuccessToast, type ButtonVariantProps } from "@shared/ui";

export type CopyShareLinkButtonProps = {
  url: string;
  size?: ButtonVariantProps["size"];
  variant?: ButtonVariantProps["variant"];
};

/**
 * Абсолютный адрес готовит вызывающая сторона: у виджета и диалога он собирается
 * по-разному (список знает токен, диалог — только что созданную ссылку).
 */
export const CopyShareLinkButton = ({
  url,
  size = "sm",
  variant = "secondary",
}: CopyShareLinkButtonProps) => {
  const handleCopy = async (): Promise<void> => {
    const copied = await copyText(url);

    if (copied) {
      showSuccessToast("Ссылка скопирована");
      return;
    }

    showErrorToast("Не удалось скопировать ссылку — выделите адрес и скопируйте вручную");
  };

  return (
    <Button
      variant={variant}
      size={size}
      iconLeft={<Copy size={14} aria-hidden="true" />}
      onClick={() => void handleCopy()}
    >
      Копировать
    </Button>
  );
};
