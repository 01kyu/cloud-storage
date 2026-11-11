const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** `formatBytes(1536)` → `"1.5 KB"`: 1024-основание. */
export const formatBytes = (bytes: number, fractionDigits = 1): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new RangeError("bytes must be a non-negative finite number");
  }

  if (bytes === 0) {
    return "0 B";
  }

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const unit = UNITS.at(exponent) ?? "B";
  const value = bytes / 1024 ** exponent;
  const formatted = exponent === 0 ? String(Math.round(value)) : value.toFixed(fractionDigits);

  return `${formatted} ${unit}`;
};
