import { describe, expect, it } from "vitest";

import { getQuotaPercent, getQuotaState } from "./quota";

describe("getQuotaPercent", () => {
  it("считает процент занятого места", () => {
    expect(getQuotaPercent(2_500, 10_000)).toBe(25);
  });

  it("округляет вниз до целого процента безопасно", () => {
    expect(getQuotaPercent(1, 3)).toBeCloseTo(33.33, 2);
  });

  it("зажимает значение в 0…100", () => {
    expect(getQuotaPercent(20_000, 10_000)).toBe(100);
    expect(getQuotaPercent(-500, 10_000)).toBe(0);
  });

  it("возвращает 0 при нулевой и некорректной квоте", () => {
    expect(getQuotaPercent(100, 0)).toBe(0);
    expect(getQuotaPercent(Number.NaN, 1_000)).toBe(0);
    expect(getQuotaPercent(100, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("getQuotaState", () => {
  it("переключается на предупреждении с 80%", () => {
    expect(getQuotaState(79.9)).toBe("normal");
    expect(getQuotaState(80)).toBe("warning");
  });

  it("переключается на критическом состоянии с 95%", () => {
    expect(getQuotaState(94.9)).toBe("warning");
    expect(getQuotaState(95)).toBe("critical");
  });
});
