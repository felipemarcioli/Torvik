import { formatNumber } from "@/lib/i18n";
import { formatTime } from "@/lib/session";

/** Preserve the session clock format while displaying the active locale's digits. */
export function formatTimer(seconds: number) {
  return formatTime(seconds)
    .split(":")
    .map((part) => formatNumber(Number(part), { minimumIntegerDigits: 2, useGrouping: false }))
    .join(":");
}
