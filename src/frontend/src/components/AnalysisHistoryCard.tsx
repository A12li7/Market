import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisRecord } from "@/types";
import {
  ASSET_TYPE_LABELS,
  INTERVALS,
  RECOMMENDATION_LABELS,
  Recommendation,
  formatPrice,
  formatTimestamp,
} from "@/types";
import { CalendarDays, ChevronLeft, Trash2, TrendingUp } from "lucide-react";

const RECOMMENDATION_STYLES: Record<Recommendation, string> = {
  [Recommendation.buy]: "border-up/40 bg-up/10 text-up",
  [Recommendation.sell]: "border-down/40 bg-down/10 text-down",
  [Recommendation.wait]: "border-border bg-secondary text-muted-foreground",
};

function intervalLabel(interval: AnalysisRecord["interval"]): string {
  return INTERVALS.find((item) => item.value === interval)?.label ?? "—";
}

interface AnalysisHistoryCardProps {
  record: AnalysisRecord;
  index: number;
  onOpen: (record: AnalysisRecord) => void;
  onDelete: (record: AnalysisRecord) => void;
}

export function AnalysisHistoryCard({
  record,
  index,
  onOpen,
  onDelete,
}: AnalysisHistoryCardProps) {
  const confidence = Number(record.confidence);
  const recommendationLabel = RECOMMENDATION_LABELS[record.recommendation];

  return (
    <div
      data-ocid={`history.item.${index}`}
      className="group relative flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-subtle transition-smooth hover:border-primary/40 hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-gradient-primary font-display text-sm font-bold text-primary-foreground">
            {record.symbol.slice(0, 4)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold tracking-tight text-foreground">
              {record.assetName}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular">{record.symbol}</span>
              <span aria-hidden="true">•</span>
              <span>{ASSET_TYPE_LABELS[record.assetType]}</span>
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 border font-semibold",
            RECOMMENDATION_STYLES[record.recommendation],
          )}
        >
          {recommendationLabel}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            الإطار الزمني
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {intervalLabel(record.interval)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            سعر التحليل
          </dt>
          <dd className="tabular mt-1 font-medium text-foreground">
            {formatPrice(record.priceAtAnalysis)}
          </dd>
        </div>
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            الثقة
          </dt>
          <dd className="mt-1 flex items-center gap-2">
            <span className="tabular font-semibold text-accent">
              {confidence}%
            </span>
            <span
              className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${Math.min(Math.max(confidence, 0), 100)}%` }}
              />
            </span>
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{formatTimestamp(record.createdAt)}</span>
        </p>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ocid={`history.delete_button.${index}`}
            aria-label={`حذف تحليل ${record.assetName}`}
            onClick={() => onDelete(record)}
            className="size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-ocid={`history.open_button.${index}`}
            onClick={() => onOpen(record)}
            className="gap-1.5"
          >
            <TrendingUp className="size-4" aria-hidden="true" />
            عرض التحليل
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AnalysisHistoryCard;
