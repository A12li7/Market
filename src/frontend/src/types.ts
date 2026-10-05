import type {
  AnalysisRecord,
  AnalysisResult,
  AssetSuggestion,
  Candle,
  ExchangeHours,
  IndicatorSet,
  NewsItem,
} from "./backend";
import {
  AssetType,
  ExchangeEvent,
  ExchangeStatus,
  Interval,
  MacdCrossover,
  Recommendation,
} from "./backend";

export type {
  AnalysisRecord,
  AnalysisResult,
  AssetSuggestion,
  Candle,
  ExchangeHours,
  IndicatorSet,
  NewsItem,
};

export {
  AssetType,
  ExchangeEvent,
  ExchangeStatus,
  Interval,
  MacdCrossover,
  Recommendation,
};

/** A selectable market asset (stock or crypto). */
export type Asset = AssetSuggestion;

/** Supported chart timeframes, with Arabic labels for the UI. */
export const INTERVALS: { value: Interval; label: string }[] = [
  { value: Interval.daily, label: "يومي" },
  { value: Interval.weekly, label: "أسبوعي" },
  { value: Interval.monthly, label: "شهري" },
];

/** Arabic labels for every supported asset class. */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [AssetType.stock]: "سهم",
  [AssetType.crypto]: "عملة رقمية",
  [AssetType.forex]: "فوركس",
  [AssetType.gold]: "ذهب/معادن",
};

/** Arabic labels for the AI recommendation. */
export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  [Recommendation.buy]: "شراء",
  [Recommendation.sell]: "بيع",
  [Recommendation.wait]: "انتظار",
};

/** Arabic labels for the MACD crossover signal. */
export const MACD_CROSSOVER_LABELS: Record<MacdCrossover, string> = {
  [MacdCrossover.bullish]: "تقاطع صاعد",
  [MacdCrossover.bearish]: "تقاطع هابط",
  [MacdCrossover.none]: "لا تقاطع",
};

/** Arabic labels for each exchange trading status. */
export const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
  [ExchangeStatus.open]: "مفتوحة",
  [ExchangeStatus.closed]: "مغلقة",
  [ExchangeStatus.preMarket]: "ما قبل الافتتاح",
  [ExchangeStatus.afterHours]: "ما بعد الإغلاق",
  [ExchangeStatus.sessionBreak]: "استراحة",
  [ExchangeStatus.holiday]: "عطلة",
};

/** Arabic labels for the next scheduled exchange event. */
export const EXCHANGE_EVENT_LABELS: Record<ExchangeEvent, string> = {
  [ExchangeEvent.open]: "الافتتاح",
  [ExchangeEvent.close]: "الإغلاق",
};

/**
 * Convert a backend millisecond timestamp into a JS Date.
 * Returns null when the value cannot be represented.
 */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a backend timestamp as an Arabic-locale date + time string. */
export function formatTimestamp(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Format a price with fixed decimals and Latin numerals for alignment. */
export function formatPrice(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a percentage change with an explicit sign. */
export function formatPercent(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a backend millisecond timestamp as an Arabic relative time
 * ("قبل 5 دقائق"). Falls back to an absolute date beyond 30 days.
 */
export function formatRelativeTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";

  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 0) return formatTimestamp(timestamp);

  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  const units: {
    limit: number;
    divisor: number;
    unit: Intl.RelativeTimeFormatUnit;
  }[] = [
    { limit: 60, divisor: 1, unit: "second" },
    { limit: 3600, divisor: 60, unit: "minute" },
    { limit: 86400, divisor: 3600, unit: "hour" },
    { limit: 2592000, divisor: 86400, unit: "day" },
  ];

  for (const { limit, divisor, unit } of units) {
    if (diffSeconds < limit) {
      return rtf.format(-Math.floor(diffSeconds / divisor), unit);
    }
  }

  return formatTimestamp(timestamp);
}

/**
 * Format a countdown given in seconds as Arabic hours/minutes
 * ("ساعتان و15 دقيقة"). Returns "الآن" for zero or negative values.
 */
export function formatCountdown(totalSeconds: bigint): string {
  const seconds = Number(totalSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return "الآن";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "ساعة" : "ساعات"}`);
  if (minutes > 0)
    parts.push(`${minutes} ${minutes === 1 ? "دقيقة" : "دقائق"}`);
  if (parts.length === 0) parts.push("أقل من دقيقة");

  return parts.join(" و");
}
