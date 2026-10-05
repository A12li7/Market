import { AssetSearch } from "@/components/AssetSearch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ASSET_TYPE_LABELS,
  type AssetSuggestion,
  INTERVALS,
  type Interval,
} from "@/types";
import { Layers, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface ComprehensiveAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Asset currently shown on the chart — used as the dialog default. */
  defaultAsset: AssetSuggestion | null;
  /** Timeframe currently shown on the chart — used as the dialog default. */
  defaultInterval: Interval;
  onConfirm: (asset: AssetSuggestion, interval: Interval) => void;
}

/**
 * One-step selection dialog for the comprehensive analysis: pick the pair/asset
 * and the timeframe together, then confirm to update the chart and start the
 * analysis. Defaults mirror the chart's current selection.
 */
export function ComprehensiveAnalysisDialog({
  open,
  onOpenChange,
  defaultAsset,
  defaultInterval,
  onConfirm,
}: ComprehensiveAnalysisDialogProps) {
  const [asset, setAsset] = useState<AssetSuggestion | null>(defaultAsset);
  const [interval, setInterval] = useState<Interval>(defaultInterval);

  // Re-seed the draft from the chart's current selection each time it opens.
  useEffect(() => {
    if (open) {
      setAsset(defaultAsset);
      setInterval(defaultInterval);
    }
  }, [open, defaultAsset, defaultInterval]);

  function handleConfirm() {
    if (!asset) return;
    onConfirm(asset, interval);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="comprehensive.dialog"
        className="max-h-[90vh] gap-5 overflow-y-auto border-border bg-card text-right sm:max-w-xl"
      >
        <DialogHeader className="gap-2 text-right">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Layers className="size-5" aria-hidden="true" />
            </span>
            <DialogTitle className="font-display text-lg font-bold tracking-tight text-foreground">
              تحليل شامل
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            اختر الأصل والإطار الزمني في خطوة واحدة، وسيتم تحديث الشارت وبدء
            التحليل الشامل تلقائياً.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-border bg-secondary/25 p-4">
            <AssetSearch onSelect={setAsset} selectedSymbol={asset?.symbol} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              الإطار الزمني
            </span>
            <div
              role="tablist"
              aria-label="الإطار الزمني للتحليل الشامل"
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1"
            >
              {INTERVALS.map((option) => {
                const active = interval === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-ocid={`comprehensive.interval.${option.value}`}
                    onClick={() => setInterval(option.value)}
                    className={cn(
                      "flex-1 rounded-md px-3.5 py-2 text-sm font-medium transition-smooth",
                      active
                        ? "bg-primary text-primary-foreground shadow-subtle"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            data-ocid="comprehensive.selection_summary"
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/50 px-4 py-3 text-xs text-muted-foreground"
          >
            <span className="font-medium text-foreground">المحدد:</span>
            {asset ? (
              <>
                <span className="truncate font-semibold text-foreground">
                  {asset.name}
                </span>
                <span className="tabular">{asset.symbol}</span>
                <span className="rounded-full border border-border px-2 py-0.5">
                  {ASSET_TYPE_LABELS[asset.assetType]}
                </span>
              </>
            ) : (
              <span>لم يتم اختيار أصل بعد</span>
            )}
            <span aria-hidden="true">•</span>
            <span>
              {INTERVALS.find((option) => option.value === interval)?.label}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <button
            type="button"
            data-ocid="comprehensive.cancel_button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-smooth hover:bg-secondary"
          >
            إلغاء
          </button>
          <button
            type="button"
            data-ocid="comprehensive.confirm_button"
            onClick={handleConfirm}
            disabled={!asset}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-glow-primary transition-smooth hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            ابدأ التحليل الشامل
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ComprehensiveAnalysisDialog;
