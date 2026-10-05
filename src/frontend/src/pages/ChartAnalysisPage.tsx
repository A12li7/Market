import { AnalysisCard } from "@/components/AnalysisCard";
import { AssetSearch } from "@/components/AssetSearch";
import { ComprehensiveAnalysisDialog } from "@/components/ComprehensiveAnalysisDialog";
import { ExchangeHoursTable } from "@/components/ExchangeHoursTable";
import { IndicatorToggles } from "@/components/IndicatorToggles";
import { NewsPanel } from "@/components/NewsPanel";
import { type IndicatorVisibility, PriceChart } from "@/components/PriceChart";
import { SummaryCard } from "@/components/SummaryCard";
import {
  useGenerateAnalysis,
  useGetCandles,
  useGetIndicators,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import {
  ASSET_TYPE_LABELS,
  type AnalysisResult,
  type AssetSuggestion,
  AssetType,
  type Candle,
  INTERVALS,
  type IndicatorSet,
  Interval,
  MacdCrossover,
  RECOMMENDATION_LABELS,
  Recommendation,
  formatPrice,
} from "@/types";
import {
  CandlestickChart,
  Compass,
  Gauge,
  Layers,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const DEFAULT_VISIBILITY: IndicatorVisibility = {
  sma20: true,
  sma50: true,
  rsi: true,
  macd: true,
};

/** Sensible asset shown on first load so the home page is never empty. */
const DEFAULT_ASSET: AssetSuggestion = {
  symbol: "AAPL",
  name: "Apple Inc.",
  assetType: AssetType.stock,
};

type AnalysisMode = "standard" | "comprehensive";

const RECOMMENDATION_STYLES: Record<Recommendation, string> = {
  [Recommendation.buy]: "border-up/40 bg-up/10 text-up",
  [Recommendation.sell]: "border-down/40 bg-down/10 text-down",
  [Recommendation.wait]: "border-border bg-secondary/50 text-muted-foreground",
};

/** Nearest support/resistance from the most recent candles. */
function deriveLevels(candles: Candle[]) {
  const recent = candles.slice(-20);
  if (recent.length === 0) return { support: 0, resistance: 0 };
  return {
    support: Math.min(...recent.map((candle) => candle.low)),
    resistance: Math.max(...recent.map((candle) => candle.high)),
  };
}

function formatIndicator(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

function IndicatorStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-1 text-sm font-semibold", accent)}>
        {value}
      </p>
    </div>
  );
}

/** Full-width comprehensive analysis breakdown built from the saved result. */
function ComprehensiveResult({
  result,
  asset,
  interval,
}: {
  result: AnalysisResult;
  asset: AssetSuggestion;
  interval: Interval;
}) {
  const { record, candles, indicators } = result;
  const { support, resistance } = deriveLevels(candles);
  const price = candles[candles.length - 1]?.close ?? record.priceAtAnalysis;
  const confidence = Number(record.confidence);

  const sma20 = indicators.sma20;
  const sma50 = indicators.sma50;
  const rsi = indicators.rsi14;
  const aboveSma20 = sma20 !== undefined && price >= sma20;
  const goldenCross =
    sma20 !== undefined && sma50 !== undefined && sma20 >= sma50;
  const macdBullish = indicators.macdCrossover === MacdCrossover.bullish;
  const rsiStrong = rsi !== undefined && rsi >= 50;

  const bullishScenario = goldenCross
    ? `استمرار الزخم الصاعد مع تداول السعر فوق المتوسط 20 (${formatPrice(
        sma20 ?? price,
      )}). اختراق المقاومة عند ${formatPrice(
        resistance,
      )} يفتح المجال لمزيد من الصعود.`
    : `تحسّن محتمل إذا تجاوز السعر المتوسط 20 (${formatPrice(
        sma20 ?? price,
      )}) وأغلق فوق المقاومة ${formatPrice(resistance)}.`;

  const bearishScenario = !aboveSma20
    ? `ضغط هابط قائم دون المتوسط 20. كسر الدعم عند ${formatPrice(
        support,
      )} يعمّق التصحيح نحو مستويات أدنى.`
    : `تراجع محتمل إذا فقد السعر الدعم عند ${formatPrice(
        support,
      )} أو تراجع مؤشر القوة النسبية دون 50.`;

  return (
    <section
      data-ocid="comprehensive.result"
      className="rounded-xl border border-border bg-card p-5 shadow-subtle sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Layers className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              التحليل الشامل
            </h2>
            <p className="text-xs text-muted-foreground">
              {asset.name} · {asset.symbol} ·{" "}
              {INTERVALS.find((option) => option.value === interval)?.label}
            </p>
          </div>
        </div>

        <span
          data-ocid="comprehensive.recommendation"
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-bold",
            RECOMMENDATION_STYLES[record.recommendation],
          )}
        >
          التوصية: {RECOMMENDATION_LABELS[record.recommendation]}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Gauge className="size-3.5" aria-hidden="true" />
              درجة الثقة
            </span>
            <span
              data-ocid="comprehensive.confidence"
              className="tabular font-semibold text-foreground"
            >
              {confidence}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-primary transition-smooth"
              style={{ width: `${Math.min(100, confidence)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <IndicatorStat
            label="SMA 20"
            value={formatIndicator(sma20)}
            accent="text-chart-3"
          />
          <IndicatorStat
            label="SMA 50"
            value={formatIndicator(sma50)}
            accent="text-chart-4"
          />
          <IndicatorStat
            label="RSI 14"
            value={formatIndicator(rsi)}
            accent="text-chart-5"
          />
          <IndicatorStat
            label="MACD"
            value={formatIndicator(indicators.macd)}
            accent="text-foreground"
          />
          <IndicatorStat
            label="إشارة MACD"
            value={formatIndicator(indicators.macdSignal)}
            accent="text-foreground"
          />
          <IndicatorStat
            label="الزخم"
            value={macdBullish ? "صاعد" : "هابط"}
            accent={macdBullish ? "text-up" : "text-down"}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div
            data-ocid="comprehensive.levels"
            className="rounded-lg border border-border bg-secondary/25 p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="size-4 text-primary" aria-hidden="true" />
              الدعم والمقاومة
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">
                  الدعم القريب
                </p>
                <p className="tabular mt-1 text-sm font-semibold text-up">
                  {formatPrice(support)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">
                  المقاومة الأولى
                </p>
                <p className="tabular mt-1 text-sm font-semibold text-down">
                  {formatPrice(resistance)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/25 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Compass className="size-4 text-accent" aria-hidden="true" />
              قراءة الاتجاه
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {goldenCross
                ? "المتوسط 20 فوق المتوسط 50، ما يدعم اتجاهًا صاعدًا على المدى القصير."
                : "المتوسط 20 دون المتوسط 50، ما يشير إلى ضعف الزخم الصاعد."}{" "}
              {rsiStrong
                ? "ومؤشر القوة النسبية فوق 50 يدعم القوة."
                : "ومؤشر القوة النسبية دون 50 يميل للضعف."}
            </p>
          </div>
        </div>

        <div
          data-ocid="comprehensive.scenarios"
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="rounded-lg border border-up/30 bg-up/5 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-up">
              <TrendingUp className="size-4" aria-hidden="true" />
              السيناريو الصاعد
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {bullishScenario}
            </p>
          </div>
          <div className="rounded-lg border border-down/30 bg-down/5 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-down">
              <TrendingDown className="size-4" aria-hidden="true" />
              السيناريو الهابط
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {bearishScenario}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/60 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-accent" aria-hidden="true" />
            التحليل التفصيلي بالذكاء الاصطناعي
          </h3>
          <p className="whitespace-pre-line text-sm leading-7 text-foreground/90">
            {record.analysisText}
          </p>
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldAlert className="size-3.5" aria-hidden="true" />
          تحليل آلي مدعوم بالمؤشرات — ليس نصيحة استثمارية.
        </p>
      </div>
    </section>
  );
}

export function ChartAnalysisPage() {
  const [asset, setAsset] = useState<AssetSuggestion | null>(DEFAULT_ASSET);
  const [interval, setInterval] = useState<Interval>(Interval.daily);
  const [visibility, setVisibility] =
    useState<IndicatorVisibility>(DEFAULT_VISIBILITY);
  const [mode, setMode] = useState<AnalysisMode>("standard");
  const [dialogOpen, setDialogOpen] = useState(false);

  const candlesQuery = useGetCandles(
    asset?.symbol ?? "",
    asset?.assetType ?? AssetType.stock,
    interval,
    !!asset,
  );
  const indicatorsQuery = useGetIndicators(
    asset?.symbol ?? "",
    asset?.assetType ?? AssetType.stock,
    interval,
    !!asset,
  );
  const analysis = useGenerateAnalysis();

  const candles = candlesQuery.data ?? [];
  const indicators = indicatorsQuery.data;

  function handleSelect(next: AssetSuggestion) {
    setAsset(next);
    setMode("standard");
    analysis.reset();
  }

  function handleIntervalChange(next: Interval) {
    setInterval(next);
    setMode("standard");
    analysis.reset();
  }

  function handleAnalyze() {
    if (!asset) return;
    setMode("standard");
    analysis.mutate({
      symbol: asset.symbol,
      assetType: asset.assetType,
      interval,
    });
  }

  function handleComprehensiveConfirm(
    nextAsset: AssetSuggestion,
    nextInterval: Interval,
  ) {
    setAsset(nextAsset);
    setInterval(nextInterval);
    setMode("comprehensive");
    analysis.reset();
    analysis.mutate({
      symbol: nextAsset.symbol,
      assetType: nextAsset.assetType,
      interval: nextInterval,
    });
  }

  const comprehensiveResult =
    mode === "comprehensive" ? analysis.data : undefined;

  return (
    <div className="container py-8 md:py-12" data-ocid="chart.page">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          تحليل الشارت
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ابحث عن سهم أو عملة رقمية، استعرض الشارت التفاعلي والمؤشرات الفنية، ثم
          اطلب تحليلاً بالذكاء الاصطناعي أو تحليلاً شاملاً.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Primary column: search + chart ─────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-6">
          <section
            data-ocid="chart.search_panel"
            className="rounded-xl border border-border bg-card p-5 shadow-subtle"
          >
            <AssetSearch
              onSelect={handleSelect}
              selectedSymbol={asset?.symbol}
            />
          </section>

          {asset ? (
            <>
              <SummaryCard
                asset={asset}
                candles={candles}
                interval={interval}
              />

              <section
                data-ocid="chart.chart_panel"
                className="rounded-xl border border-border bg-card p-4 shadow-subtle sm:p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CandlestickChart
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    <h2 className="font-display text-sm font-bold text-foreground">
                      الشارت التفاعلي
                    </h2>
                  </div>

                  <div
                    role="tablist"
                    aria-label="الإطار الزمني"
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
                          data-ocid={`chart.interval.${option.value}`}
                          onClick={() => handleIntervalChange(option.value)}
                          className={cn(
                            "rounded-md px-3.5 py-1.5 text-xs font-medium transition-smooth",
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

                <PriceChart
                  candles={candles}
                  visibility={visibility}
                  loading={candlesQuery.isLoading}
                />

                {candlesQuery.isError && (
                  <p
                    data-ocid="chart.error_state"
                    className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground"
                  >
                    تعذّر تحميل بيانات الشارت لهذا الأصل.
                  </p>
                )}
              </section>

              <section
                data-ocid="chart.indicators_panel"
                className="rounded-xl border border-border bg-card p-5 shadow-subtle"
              >
                <h2 className="mb-4 font-display text-sm font-bold text-foreground">
                  المؤشرات الفنية
                </h2>
                <IndicatorToggles
                  visibility={visibility}
                  onChange={setVisibility}
                  indicators={indicators}
                />
              </section>

              {mode === "comprehensive" && analysis.isPending && (
                <section
                  data-ocid="comprehensive.loading_state"
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16"
                >
                  <Loader2
                    className="size-7 animate-spin text-accent"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted-foreground">
                    جارٍ إعداد التحليل الشامل وقراءة المؤشرات…
                  </p>
                </section>
              )}

              {mode === "comprehensive" && analysis.isError && (
                <section
                  data-ocid="comprehensive.error_state"
                  className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground"
                >
                  تعذّر إنشاء التحليل الشامل.{" "}
                  {analysis.error?.message ?? "حاول مرة أخرى."}
                </section>
              )}

              {comprehensiveResult && (
                <ComprehensiveResult
                  result={comprehensiveResult}
                  asset={asset}
                  interval={interval}
                />
              )}
            </>
          ) : (
            <section
              data-ocid="chart.empty_state"
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CandlestickChart className="size-7" aria-hidden="true" />
              </span>
              <h2 className="font-display text-lg font-bold text-foreground">
                ابدأ باختيار أصل مالي
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                اكتب رمز سهم مثل AAPL أو اسم عملة رقمية مثل bitcoin في حقل البحث
                أعلاه لعرض الشارت والمؤشرات.
              </p>
            </section>
          )}
        </div>

        {/* ── Sidebar: AI analysis ───────────────────────────────────── */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <button
            type="button"
            data-ocid="comprehensive.open_modal_button"
            onClick={() => setDialogOpen(true)}
            disabled={analysis.isPending}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-lg bg-gradient-primary font-display text-base font-bold text-primary-foreground shadow-glow-primary transition-smooth hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {mode === "comprehensive" && analysis.isPending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Layers className="size-5" aria-hidden="true" />
            )}
            تحليل شامل
          </button>

          <button
            type="button"
            data-ocid="analysis.primary_button"
            onClick={handleAnalyze}
            disabled={!asset || analysis.isPending}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-secondary/50 font-display text-sm font-bold text-foreground transition-smooth hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === "standard" && analysis.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            حلّل الشارت
          </button>

          {asset && (
            <p className="text-center text-xs text-muted-foreground">
              {asset.name} · {ASSET_TYPE_LABELS[asset.assetType]} ·{" "}
              {INTERVALS.find((option) => option.value === interval)?.label}
            </p>
          )}

          {mode === "standard" && (
            <AnalysisCard
              record={analysis.data?.record}
              isPending={analysis.isPending}
              isError={analysis.isError}
              errorMessage={analysis.error?.message}
              onRegenerate={handleAnalyze}
            />
          )}

          <NewsPanel defaultKeyword={asset?.symbol ?? ""} />
        </aside>
      </div>

      <div className="mt-6">
        <ExchangeHoursTable />
      </div>

      <ComprehensiveAnalysisDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultAsset={asset}
        defaultInterval={interval}
        onConfirm={handleComprehensiveConfirm}
      />
    </div>
  );
}

export default ChartAnalysisPage;
