import { cn } from "@/lib/utils";
import type { IndicatorSet, MacdCrossover } from "@/types";
import { MACD_CROSSOVER_LABELS } from "@/types";
import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { IndicatorVisibility } from "./PriceChart";

interface IndicatorTogglesProps {
  visibility: IndicatorVisibility;
  onChange: (next: IndicatorVisibility) => void;
  indicators: IndicatorSet | undefined;
}

const TOGGLES: {
  key: keyof IndicatorVisibility;
  label: string;
  hint: string;
  swatch: string;
}[] = [
  {
    key: "sma20",
    label: "المتوسط 20",
    hint: "SMA 20",
    swatch: "bg-chart-3",
  },
  {
    key: "sma50",
    label: "المتوسط 50",
    hint: "SMA 50",
    swatch: "bg-chart-4",
  },
  {
    key: "rsi",
    label: "مؤشر القوة النسبية",
    hint: "RSI 14",
    swatch: "bg-chart-5",
  },
  {
    key: "macd",
    label: "الماكد",
    hint: "MACD",
    swatch: "bg-chart-1",
  },
];

function crossoverMeta(crossover: MacdCrossover | undefined) {
  if (crossover === "bullish") {
    return {
      Icon: ArrowUpRight,
      className: "text-up",
      label: MACD_CROSSOVER_LABELS.bullish,
    };
  }
  if (crossover === "bearish") {
    return {
      Icon: ArrowDownRight,
      className: "text-down",
      label: MACD_CROSSOVER_LABELS.bearish,
    };
  }
  return {
    Icon: Minus,
    className: "text-muted-foreground",
    label: MACD_CROSSOVER_LABELS.none,
  };
}

function formatIndicator(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

export function IndicatorToggles({
  visibility,
  onChange,
  indicators,
}: IndicatorTogglesProps) {
  const crossover = crossoverMeta(indicators?.macdCrossover);
  const CrossoverIcon = crossover.Icon;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {TOGGLES.map((toggle) => {
          const active = visibility[toggle.key];
          return (
            <button
              key={toggle.key}
              type="button"
              role="switch"
              aria-checked={active}
              data-ocid={`indicator.toggle.${toggle.key}`}
              onClick={() => onChange({ ...visibility, [toggle.key]: !active })}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-smooth",
                active
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "size-2.5 rounded-full transition-smooth",
                  toggle.swatch,
                  active ? "opacity-100" : "opacity-30",
                )}
                aria-hidden="true"
              />
              {toggle.label}
              <span className="tabular text-[10px] text-muted-foreground">
                {toggle.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="text-[11px] text-muted-foreground">SMA 20</p>
          <p className="tabular mt-1 text-sm font-semibold text-chart-3">
            {formatIndicator(indicators?.sma20)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="text-[11px] text-muted-foreground">SMA 50</p>
          <p className="tabular mt-1 text-sm font-semibold text-chart-4">
            {formatIndicator(indicators?.sma50)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="text-[11px] text-muted-foreground">RSI 14</p>
          <p className="tabular mt-1 text-sm font-semibold text-chart-5">
            {formatIndicator(indicators?.rsi14)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Activity className="size-3" aria-hidden="true" />
            MACD
          </p>
          <p className="tabular mt-1 text-sm font-semibold text-foreground">
            {formatIndicator(indicators?.macd)}
          </p>
        </div>
      </div>

      <div
        data-ocid="indicator.macd_signal"
        className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3"
      >
        <span className="text-xs text-muted-foreground">إشارة تقاطع MACD</span>
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm font-semibold",
            crossover.className,
          )}
        >
          <CrossoverIcon className="size-4" aria-hidden="true" />
          {crossover.label}
        </span>
      </div>
    </div>
  );
}

export default IndicatorToggles;
