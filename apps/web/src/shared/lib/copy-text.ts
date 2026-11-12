/**
 * Буфер обмена доступен не всегда (незащищённый контекст, отказ в разрешении),
 * поэтому вызывающая сторона получает флаг, а не исключение.
 */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch {
    return false;
  }
};
