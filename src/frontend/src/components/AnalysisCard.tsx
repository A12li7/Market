import { cn } from "@/lib/utils";
import type { AnalysisRecord } from "@/types";
import { RECOMMENDATION_LABELS, formatPrice, formatTimestamp } from "@/types";
import {
  BarChart3,
  Compass,
  Gauge,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";

interface AnalysisCardProps {
  record: AnalysisRecord | undefined;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  onRegenerate: () => void;
}

const SECTION_META: {
  key: string;
  title: string;
  icon: typeof Compass;
  accent: string;
}[] = [
  {
    key: "الاتجاه العام",
    title: "الاتجاه العام",
    icon: Compass,
    accent: "text-accent",
  },
  {
    key: "الدعم والمقاومة",
    title: "الدعم والمقاومة",
    icon: Target,
    accent: "text-primary",
  },
  {
    key: "قراءة المؤشرات",
    title: "قراءة المؤشرات",
    icon: BarChart3,
    accent: "text-chart-5",
  },
];

/** Split the AI text into labelled sections when headings are present. */
function parseSections(text: string): { title: string; body: string }[] {
  const lines = text.split("\n");
  const sections: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const heading = SECTION_META.find((meta) => line.startsWith(meta.key));
    if (heading) {
      if (current) sections.push(current);
      current = {
        title: heading.title,
        body: line.slice(heading.key.length).replace(/^[:：\-\s]+/, ""),
      };
    } else if (current) {
      current.body = `${current.body}\n${line}`.trim();
    } else {
      current = { title: "التحليل", body: line };
    }
  }
  if (current) sections.push(current);
  return sections;
}

function recommendationStyle(recommendation: AnalysisRecord["recommendation"]) {
  if (recommendation === "buy") {
    return "border-up/40 bg-up/10 text-up";
  }
  if (recommendation === "sell") {
    return "border-down/40 bg-down/10 text-down";
  }
  return "border-border bg-secondary/50 text-muted-foreground";
}

function Section({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: typeof Compass;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/25 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className={cn("size-4", accent)} aria-hidden="true" />
        {title}
      </h4>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

export function AnalysisCard({
  record,
  isPending,
  isError,
  errorMessage,
  onRegenerate,
}: AnalysisCardProps) {
  return (
    <section
      data-ocid="analysis.card"
      className="rounded-xl border border-border bg-card p-5 shadow-subtle sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              التحليل الفني بالذكاء الاصطناعي
            </h3>
            <p className="text-xs text-muted-foreground">
              قراءة آلية مدعومة بالمؤشرات — ليست نصيحة استثمارية
            </p>
          </div>
        </div>

        <button
          type="button"
          data-ocid="analysis.regenerate_button"
          onClick={onRegenerate}
          disabled={isPending}
          className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground transition-smooth hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw
            className={cn("size-3.5", isPending && "animate-spin")}
            aria-hidden="true"
          />
          إعادة التحليل
        </button>
      </div>

      {isPending && (
        <div
          data-ocid="analysis.loading_state"
          className="mt-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12"
        >
          <Loader2
            className="size-7 animate-spin text-accent"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            جارٍ تحليل الشارت وقراءة المؤشرات…
          </p>
        </div>
      )}

      {!isPending && isError && (
        <div
          data-ocid="analysis.error_state"
          className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground"
        >
          تعذّر إنشاء التحليل. {errorMessage ?? "حاول مرة أخرى."}
        </div>
      )}

      {!isPending && !isError && !record && (
        <div
          data-ocid="analysis.empty_state"
          className="mt-6 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center"
        >
          <Gauge className="size-7 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            اضغط «حلّل الشارت» للحصول على قراءة فنية كاملة.
          </p>
        </div>
      )}

      {!isPending && !isError && record && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              data-ocid="analysis.recommendation"
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-bold",
                recommendationStyle(record.recommendation),
              )}
            >
              التوصية: {RECOMMENDATION_LABELS[record.recommendation]}
            </span>
            <span className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-xs text-muted-foreground">
              الثقة
              <span className="tabular font-semibold text-foreground">
                {record.confidence.toString()}%
              </span>
            </span>
            <span className="tabular text-xs text-muted-foreground">
              سعر التحليل: {formatPrice(record.priceAtAnalysis)}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-primary transition-smooth"
              style={{ width: `${Math.min(100, Number(record.confidence))}%` }}
            />
          </div>

          <div className="grid gap-3">
            {parseSections(record.analysisText).map((section, index) => {
              const meta = SECTION_META.find((m) => m.title === section.title);
              return (
                <Section
                  key={`${section.title}-${index}`}
                  title={section.title}
                  icon={meta?.icon ?? Sparkles}
                  accent={meta?.accent ?? "text-accent"}
                >
                  {section.body}
                </Section>
              );
            })}
          </div>

          <p className="text-end text-[11px] text-muted-foreground">
            أُنشئ في {formatTimestamp(record.createdAt)}
          </p>
        </div>
      )}
    </section>
  );
}

export default AnalysisCard;
