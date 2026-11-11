import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Separator } from "./Separator";

describe("Separator", () => {
  it("декоративный разделитель скрыт от скринридеров", () => {
    render(<Separator />);

    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("смысловой разделитель имеет роль и ориентацию", () => {
    render(<Separator decorative={false} orientation="vertical" />);

    const separator = screen.getByRole("separator");

    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });
});
