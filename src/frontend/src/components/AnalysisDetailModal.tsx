import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CalendarDays, Gauge, Layers, Tag } from "lucide-react";
import type { ReactNode } from "react";

const RECOMMENDATION_STYLES: Record<Recommendation, string> = {
  [Recommendation.buy]: "border-up/40 bg-up/10 text-up",
  [Recommendation.sell]: "border-down/40 bg-down/10 text-down",
  [Recommendation.wait]: "border-border bg-secondary text-muted-foreground",
};

function intervalLabel(interval: AnalysisRecord["interval"]): string {
  return INTERVALS.find((item) => item.value === interval)?.label ?? "—";
}

/** Render the free-form Arabic analysis text, promoting markdown-style headings. */
function AnalysisBody({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block, index) => ({ id: `analysis-block-${index}`, block }));

  if (blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        لا يتوفر نص التحليل لهذا السجل.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map(({ id, block }) => {
        const headingMatch = block.match(/^#{1,4}\s+(.*)$/);
        if (headingMatch) {
          return (
            <h3
              key={id}
              className="font-display text-sm font-bold tracking-tight text-primary"
            >
              {headingMatch[1]}
            </h3>
          );
        }
        const lines = block.split("\n");
        return (
          <p
            key={id}
            className="whitespace-pre-line text-sm leading-7 text-foreground/90"
          >
            {lines.join("\n")}
          </p>
        );
      })}
    </div>
  );
}

function MetaItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border bg-secondary/40 p-3">
      <span className="mt-0.5 text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">
          {children}
        </p>
      </div>
    </div>
  );
}

interface AnalysisDetailModalProps {
  record: AnalysisRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalysisDetailModal({
  record,
  open,
  onOpenChange,
}: AnalysisDetailModalProps) {
  const confidence = record ? Number(record.confidence) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="history.detail_modal"
        className="max-h-[90vh] gap-5 overflow-y-auto border-border bg-card p-0 sm:max-w-2xl"
      >
        {record && (
          <>
            <DialogHeader className="gap-3 border-b border-border bg-gradient-surface p-6 text-right">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
                    {record.assetName}
                  </DialogTitle>
                  <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular">{record.symbol}</span>
                    <span aria-hidden="true">•</span>
                    <span>{ASSET_TYPE_LABELS[record.assetType]}</span>
                    <span aria-hidden="true">•</span>
                    <span>{intervalLabel(record.interval)}</span>
                  </DialogDescription>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 border font-semibold",
                    RECOMMENDATION_STYLES[record.recommendation],
                  )}
                >
                  {RECOMMENDATION_LABELS[record.recommendation]}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-5 px-6 pb-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetaItem icon={<Tag className="size-4" />} label="سعر التحليل">
                  <span className="tabular">
                    {formatPrice(record.priceAtAnalysis)}
                  </span>
                </MetaItem>
                <MetaItem
                  icon={<Gauge className="size-4" />}
                  label="درجة الثقة"
                >
                  <span className="tabular text-accent">{confidence}%</span>
                </MetaItem>
                <MetaItem
                  icon={<CalendarDays className="size-4" />}
                  label="تاريخ التحليل"
                >
                  {formatTimestamp(record.createdAt)}
                </MetaItem>
              </div>

              <div className="rounded-lg border border-border bg-background/60 p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold tracking-tight text-foreground">
                  <Layers className="size-4 text-accent" aria-hidden="true" />
                  التحليل الفني
                </h2>
                <AnalysisBody text={record.analysisText} />
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                هذا التحليل مُولَّد بالذكاء الاصطناعي ولا يُعد نصيحة استثمارية.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AnalysisDetailModal;
