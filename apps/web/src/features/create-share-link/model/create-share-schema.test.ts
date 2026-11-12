import { describe, expect, it } from "vitest";

import { SharePermission } from "@cs/shared";

import { expiresAtFromNow } from "../lib/expires-at";

import { SHARE_EXPIRY, createShareFormSchema } from "./create-share-schema";

const NOW = new Date("2026-03-01T10:00:00.000Z");

const validValues = {
  permission: SharePermission.Download,
  expiresIn: SHARE_EXPIRY.week,
  protectWithPassword: false,
  password: "",
};

describe("createShareFormSchema", () => {
  it("пропускает ссылку без пароля", () => {
    expect(createShareFormSchema.safeParse(validValues).success).toBe(true);
  });

  it("требует пароль минимум из четырёх символов", () => {
    const locked = { ...validValues, protectWithPassword: true };
    const tooShort = createShareFormSchema.safeParse({ ...locked, password: " 12 " });
    const ok = createShareFormSchema.safeParse({ ...locked, password: " 1234 " });

    expect(tooShort.success).toBe(false);
    expect(tooShort.error?.issues[0]?.path).toEqual(["password"]);
    expect(ok.success).toBe(true);
  });

  it("ограничивает пароль сверху", () => {
    const result = createShareFormSchema.safeParse({
      ...validValues,
      protectWithPassword: true,
      password: "a".repeat(73),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("72");
  });
});

describe("expiresAtFromNow", () => {
  it("не задаёт срок для бессрочной ссылки", () => {
    expect(expiresAtFromNow(SHARE_EXPIRY.never, NOW)).toBeUndefined();
  });

  it("отсчитывает дни от текущего момента", () => {
    expect(expiresAtFromNow(SHARE_EXPIRY.day, NOW)).toBe("2026-03-02T10:00:00.000Z");
    expect(expiresAtFromNow(SHARE_EXPIRY.week, NOW)).toBe("2026-03-08T10:00:00.000Z");
    expect(expiresAtFromNow(SHARE_EXPIRY.month, NOW)).toBe("2026-03-31T10:00:00.000Z");
  });
});
