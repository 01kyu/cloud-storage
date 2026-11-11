export type QuotaState = "normal" | "warning" | "critical";

/** Процент занятого места, зажатый в `0…100`; при некорректном вводе — 0. */
export const getQuotaPercent = (used: number, quota: number): number => {
  if (!Number.isFinite(used) || !Number.isFinite(quota) || quota <= 0) {
    return 0;
  }

  return Math.min(Math.max((used / quota) * 100, 0), 100);
};

/** Порог предупреждения — 80%, критический — 95%. */
export const getQuotaState = (percent: number): QuotaState => {
  if (percent >= 95) {
    return "critical";
  }

  return percent >= 80 ? "warning" : "normal";
};
