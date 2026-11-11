import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuotaCard } from "./quota-card";

describe("QuotaCard", () => {
  it("показывает занятое и доступное место", () => {
    render(<QuotaCard used={1_048_576} quota={10_485_760} />);

    expect(screen.getByText("1.0 MB")).toBeInTheDocument();
    expect(screen.getByText(/из 10.0 MB/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Занято 10% хранилища" })).toBeInTheDocument();
  });

  it("показывает плейсхолдеры во время загрузки", () => {
    render(<QuotaCard used={0} quota={0} loading />);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/из/)).not.toBeInTheDocument();
  });

  it("подсвечивает критическое заполнение", () => {
    render(<QuotaCard used={9_900} quota={10_000} />);

    expect(screen.getByRole("progressbar", { name: "Занято 99% хранилища" })).toBeInTheDocument();
  });
});
