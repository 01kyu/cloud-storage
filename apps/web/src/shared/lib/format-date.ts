type FormatDateOptions = {
  locale?: string;
  timeZone?: string;
};

const DEFAULT_LOCALE = "ru-RU";

/** Локаль и таймзона параметризованы, чтобы тесты не зависели от окружения. */
export const formatDate = (value: string | Date, options: FormatDateOptions = {}): string => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: options.timeZone,
  }).format(date);
};
