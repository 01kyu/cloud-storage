/** 64 hex-символа: контракт проверяет только формат, SHA-256 будет на бэкенде. */
export const checksumOf = (value: string): string => {
  let state = 0x811c9dc5;
  let result = "";

  for (let index = 0; index < 64; index += 1) {
    state = ((state ^ value.charCodeAt(index % value.length)) * 0x01000193) >>> 0;
    result += ((state >>> 28) & 0xf).toString(16);
  }

  return result;
};
