import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "./api-error";

const FALLBACK = "Что-то пошло не так";

describe("getApiErrorMessage", () => {
  it("берёт сообщение из контрактного ApiError", () => {
    const error = {
      status: 401,
      data: { statusCode: 401, code: "UNAUTHORIZED", message: "Неверный email или пароль" },
    };

    expect(getApiErrorMessage(error, FALLBACK)).toBe("Неверный email или пароль");
  });

  it("возвращает запасной текст для неизвестного формата тела", () => {
    expect(getApiErrorMessage({ status: 500, data: { message: "raw" } }, FALLBACK)).toBe(FALLBACK);
  });

  it("возвращает запасной текст для сетевой ошибки и HTML-ответа", () => {
    expect(getApiErrorMessage({ status: "FETCH_ERROR", error: "boom" }, FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorMessage({ status: 404, data: "<!DOCTYPE html>" }, FALLBACK)).toBe(FALLBACK);
  });

  it("возвращает запасной текст для пустого значения", () => {
    expect(getApiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });
});
