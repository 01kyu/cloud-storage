import {
  NodeType,
  type CreateSharePayload,
  type Node,
  type PublicShare,
  type Share,
} from "@cs/shared";

import { findNode, getDb, saveDb, type MockShare } from "./db";

/**
 * Токен — единственное, что знает гость, поэтому он длинный и без похожих
 * символов (`l`/`1`, `O`/`0`): ссылку часто перепечатывают вручную.
 */
const TOKEN_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TOKEN_LENGTH = 24;

const generateToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH));

  return Array.from(bytes, (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]).join("");
};

const uniqueToken = (): string => {
  const taken = new Set(getDb().shares.map((share) => share.token));
  let token = generateToken();

  while (taken.has(token)) {
    token = generateToken();
  }

  return token;
};

/** Наружу отдаётся копия без пароля: он не входит в контрактный `Share`. */
export const shareRecord = (share: MockShare): Share => {
  const { password: _password, ...rest } = share;

  return rest;
};

/**
 * Ссылка на удалённый объект не работает, поэтому в списке её нет: проверяем
 * существование узла, а не только запись шары.
 */
export const listShares = (): Share[] =>
  getDb()
    .shares.filter((share) => findNode(share.nodeId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(shareRecord);

export const findShareByToken = (token: string): MockShare | undefined =>
  getDb().shares.find((share) => share.token === token);

/** `expiresAt === null` — бессрочная ссылка. */
export const isShareExpired = (share: Share, now: number = Date.now()): boolean =>
  share.expiresAt !== null && Date.parse(share.expiresAt) <= now;

/** Пароль проверяется только у защищённых ссылок: остальным он не нужен. */
export const matchesSharePassword = (share: MockShare, password: string | null): boolean =>
  !share.hasPassword || share.password === password;

export type CreateMockShareResult =
  { ok: true; share: MockShare } | { ok: false; reason: "node-not-found" | "type-mismatch" };

/**
 * `nodeType` в payload — защита от гонки: клиент знает, с каким узлом работает,
 * и не должен «поделиться» папкой, которую тем временем заменил файл.
 */
export const createMockShare = (payload: CreateSharePayload): CreateMockShareResult => {
  const node = findNode(payload.nodeId);

  if (!node) {
    return { ok: false, reason: "node-not-found" };
  }

  if (node.type !== payload.nodeType) {
    return { ok: false, reason: "type-mismatch" };
  }

  const share: MockShare = {
    id: crypto.randomUUID(),
    nodeId: node.id,
    nodeType: node.type,
    nodeName: node.name,
    token: uniqueToken(),
    permission: payload.permission,
    hasPassword: Boolean(payload.password),
    expiresAt: payload.expiresAt ?? null,
    createdAt: new Date().toISOString(),
    password: payload.password ?? null,
  };

  getDb().shares.push(share);
  saveDb();

  return { ok: true, share };
};

export const deleteMockShare = (shareId: string): boolean => {
  const current = getDb();
  const before = current.shares.length;

  current.shares = current.shares.filter((share) => share.id !== shareId);

  if (current.shares.length === before) {
    return false;
  }

  saveDb();

  return true;
};

/**
 * Публичная карточка собирается из живого узла: переименование сразу видно
 * гостю, а размер и mime не приходится дублировать в саму шару.
 */
export const publicShareOf = (share: MockShare): PublicShare | null => {
  const node: Node | undefined = findNode(share.nodeId);

  if (!node) {
    return null;
  }

  return {
    token: share.token,
    nodeType: node.type,
    nodeName: node.name,
    mimeType: node.type === NodeType.File ? node.mimeType : null,
    size: node.size,
    permission: share.permission,
    hasPassword: share.hasPassword,
    expiresAt: share.expiresAt,
  };
};
