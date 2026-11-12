"use client";

import { useEffect } from "react";

/** Ctrl+K и ⌘K открывают палитру из любого места приложения. */
export const useSearchHotkey = (onOpen: () => void): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();
      onOpen();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpen]);
};
