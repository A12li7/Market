import { cn } from "@/lib/utils";
import type { AssetSuggestion, Candle, Interval } from "@/types";
import {
  ASSET_TYPE_LABELS,
  Interval as IntervalEnum,
  formatPercent,
  formatPrice,
} from "@/types";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface SummaryCardProps {
  asset: AssetSuggestion;
  candles: Candle[];
  interval: Interval;
}

const CHANGE_LABELS: Record<Interval, string> = {
  [IntervalEnum.daily]: "اليوم",
  [IntervalEnum.weekly]: "هذا الأسبوع",
  [IntervalEnum.monthly]: "هذا الشهر",
};

export function SummaryCard({ asset, candles, interval }: SummaryCardProps) {
  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2];

  const currentPrice = latest?.close ?? 0;
  const changePercent =
    latest && previous && previous.close !== 0
      ? ((latest.close - previous.close) / previous.close) * 100
      : 0;

  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const periodHigh = highs.length > 0 ? Math.max(...highs) : 0;
  const periodLow = lows.length > 0 ? Math.min(...lows) : 0;

  const isUp = changePercent > 0;
  const isFlat = changePercent === 0;
  const ChangeIcon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const changeClass = isFlat
    ? "text-muted-foreground"
    : isUp
      ? "text-up"
      : "text-down";

  return (
    <div
      data-ocid="summary.card"
      className="rounded-xl border border-border bg-gradient-surface p-5 shadow-subtle"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-lg font-bold text-foreground">
              {asset.name}
            </h2>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {ASSET_TYPE_LABELS[asset.assetType]}
            </span>
          </div>
          <p className="tabular mt-0.5 text-xs text-muted-foreground">
            {asset.symbol}
          </p>
        </div>

        <div className="text-end">
          <p className="tabular text-2xl font-bold text-foreground sm:text-3xl">
            {formatPrice(currentPrice)}
          </p>
          <p
            data-ocid="summary.change"
            className={cn(
              "tabular mt-1 flex items-center justify-end gap-1 text-sm font-semibold",
              changeClass,
            )}
          >
            <ChangeIcon className="size-4" aria-hidden="true" />
            {formatPercent(changePercent)}
            <span className="text-xs font-normal text-muted-foreground">
              {CHANGE_LABELS[interval]}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <p className="text-[11px] text-muted-foreground">أعلى سعر للفترة</p>
          <p className="tabular mt-1 text-sm font-semibold text-up">
            {formatPrice(periodHigh)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <p className="text-[11px] text-muted-foreground">أدنى سعر للفترة</p>
          <p className="tabular mt-1 text-sm font-semibold text-down">
            {formatPrice(periodLow)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SummaryCard;
