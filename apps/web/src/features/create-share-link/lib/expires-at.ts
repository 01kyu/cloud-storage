import { SHARE_EXPIRY, type ShareExpiry } from "../model/create-share-schema";

const DAY_MS = 24 * 60 * 60 * 1000;

const EXPIRY_DAYS: Record<ShareExpiry, number> = {
  [SHARE_EXPIRY.never]: 0,
  [SHARE_EXPIRY.day]: 1,
  [SHARE_EXPIRY.week]: 7,
  [SHARE_EXPIRY.month]: 30,
};

/**
 * `undefined` — бессрочная ссылка: контракт делает `expiresAt` необязательным,
 * поэтому «бессрочно» не превращается в бесконечно далёкую дату.
 */
export const expiresAtFromNow = (
  expiry: ShareExpiry,
  now: Date = new Date(),
): string | undefined => {
  const days = EXPIRY_DAYS[expiry];

  return days === 0 ? undefined : new Date(now.getTime() + days * DAY_MS).toISOString();
};
