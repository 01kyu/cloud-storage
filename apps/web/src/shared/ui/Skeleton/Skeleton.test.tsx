import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("скрыт от скринридеров и принимает размеры", () => {
    const { container } = render(<Skeleton width={120} height={16} />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton).toHaveStyle({ width: "120px", height: "16px" });
  });

  it("совмещает стили из пропсов и style", () => {
    const { container } = render(<Skeleton style={{ marginTop: 8 }} height="2rem" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveStyle({ height: "2rem", marginTop: "8px" });
  });
});
