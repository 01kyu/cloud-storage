import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Avatar } from "./Avatar";

class LoadedImage {
  complete = true;

  naturalWidth = 40;

  src = "";

  crossOrigin: string | null = null;

  referrerPolicy = "";

  addEventListener = vi.fn();

  removeEventListener = vi.fn();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Avatar", () => {
  it("показывает fallback, пока изображения нет", async () => {
    render(<Avatar alt="Демо-пользователь" fallback="ДП" />);

    expect(await screen.findByText("ДП")).toBeInTheDocument();
  });

  it("показывает fallback, если изображение не загрузилось", async () => {
    render(<Avatar src="/broken.png" alt="Демо-пользователь" fallback="ДП" />);

    expect(await screen.findByText("ДП")).toBeInTheDocument();
    expect(screen.queryByAltText("Демо-пользователь")).not.toBeInTheDocument();
  });

  it("рендерит изображение с alt, когда оно загружено", () => {
    vi.stubGlobal("Image", LoadedImage);

    render(<Avatar src="/avatar.png" alt="Демо-пользователь" fallback="ДП" />);

    expect(screen.getByAltText("Демо-пользователь")).toHaveAttribute("src", "/avatar.png");
  });
});
