"use client";

import { useEffect, useState } from "react";

/**
 * `origin` известен только в браузере, поэтому до гидрации ссылка пустая:
 * абсолютный адрес нужен для копирования, относительный в мессенджере бесполезен.
 */
export const useOrigin = (): string => {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return origin;
};
