import { describe, expect, it } from "vitest";

import { NodeType, SharePermission, type Share } from "@cs/shared";

import { describeShare, describeShareExpiry, describeSharePermission } from "./describe-share";

const baseShare: Share = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3304",
  nodeId: "3f2504e0-4f89-41d3-9a0c-0305e82c3303",
  nodeType: NodeType.File,
  nodeName: "report.pdf",
  token: "share-token-123",
  permission: SharePermission.Download,
  hasPassword: true,
  expiresAt: "2026-03-01T10:00:00.000Z",
  createdAt: "2026-02-01T10:00:00.000Z",
};

describe("describeShare", () => {
  it("перечисляет тип, права, срок, размер и пароль", () => {
    const label = describeShare(baseShare, 1536);

    expect(label).toContain("Файл · просмотр и скачивание");
    expect(label).toContain("до ");
    expect(label).toContain("1.5 KB");
    expect(label).toContain("по паролю");
  });

  it("опускает размер и пароль, если их нет", () => {
    expect(
      describeShare({
        ...baseShare,
        nodeType: NodeType.Folder,
        permission: SharePermission.Read,
        hasPassword: false,
        expiresAt: null,
      }),
    ).toBe("Папка · только просмотр · бессрочно");
  });

  it("описывает срок действия", () => {
    expect(describeShareExpiry(null)).toBe("бессрочно");
    expect(describeShareExpiry("2026-03-01T10:00:00.000Z")).toMatch(/^до /);
  });

  it("переводит права в человекочитаемый текст", () => {
    expect(describeSharePermission(SharePermission.Read)).toBe("только просмотр");
    expect(describeSharePermission(SharePermission.Download)).toBe("просмотр и скачивание");
  });
});
