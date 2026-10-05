import { useExchangeHours } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import {
  EXCHANGE_EVENT_LABELS,
  EXCHANGE_STATUS_LABELS,
  type ExchangeHours,
  ExchangeStatus,
  formatCountdown,
} from "@/types";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Globe2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";

/** Statuses that count as "currently trading" for sorting and highlighting. */
const OPEN_STATUSES: ExchangeStatus[] = [
  ExchangeStatus.open,
  ExchangeStatus.preMarket,
  ExchangeStatus.afterHours,
];

/** Per-status visual treatment: badge classes, dot color, row accent. */
const STATUS_STYLES: Record<
  ExchangeStatus,
  { badge: string; dot: string; row: string }
> = {
  [ExchangeStatus.open]: {
    badge: "border-up/40 bg-up/10 text-up",
    dot: "bg-up",
    row: "bg-up/[0.04]",
  },
  [ExchangeStatus.preMarket]: {
    badge: "border-primary/40 bg-primary/10 text-primary",
    dot: "bg-primary",
    row: "bg-primary/[0.03]",
  },
  [ExchangeStatus.afterHours]: {
    badge: "border-accent/40 bg-accent/10 text-accent",
    dot: "bg-accent",
    row: "bg-accent/[0.03]",
  },
  [ExchangeStatus.sessionBreak]: {
    badge: "border-warning/40 bg-warning/10 text-warning",
    dot: "bg-warning",
    row: "bg-warning/[0.03]",
  },
  [ExchangeStatus.holiday]: {
    badge: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    row: "bg-destructive/[0.03]",
  },
  [ExchangeStatus.closed]: {
    badge: "border-border bg-muted/60 text-muted-foreground",
    dot: "bg-muted-foreground/60",
    row: "",
  },
};

function isOpen(status: ExchangeStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

/** Sort open exchanges first, then by name for a stable order. */
function sortExchanges(list: ExchangeHours[]): ExchangeHours[] {
  return [...list].sort((a, b) => {
    const openDiff = Number(isOpen(b.status)) - Number(isOpen(a.status));
    if (openDiff !== 0) return openDiff;
    return a.name.localeCompare(b.name, "ar");
  });
}

function StatusBadge({ status }: { status: ExchangeStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        style.badge,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", style.dot)}
        aria-hidden="true"
      />
      {EXCHANGE_STATUS_LABELS[status]}
    </span>
  );
}

function CountdownCell({ exchange }: { exchange: ExchangeHours }) {
  const isNextOpen = exchange.nextEvent === "open";
  const Icon = isNextOpen ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={cn("size-4 shrink-0", isNextOpen ? "text-up" : "text-down")}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="tabular text-sm font-semibold text-foreground">
          {formatCountdown(exchange.countdownSeconds)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          حتى {EXCHANGE_EVENT_LABELS[exchange.nextEvent]}
        </span>
      </div>
    </div>
  );
}

function ExchangeRow({
  exchange,
  index,
}: {
  exchange: ExchangeHours;
  index: number;
}) {
  const style = STATUS_STYLES[exchange.status];
  const open = isOpen(exchange.status);

  return (
    <tr
      data-ocid={`exchange.row.${index + 1}`}
      className={cn(
        "border-b border-border/60 transition-smooth last:border-b-0 hover:bg-secondary/40",
        style.row,
      )}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold tracking-tight",
              open
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-muted/50 text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {exchange.code.slice(0, 4)}
          </span>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-display text-sm font-semibold text-foreground">
              {exchange.name}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Globe2 className="size-3" aria-hidden="true" />
              {exchange.country}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <StatusBadge status={exchange.status} />
      </td>

      <td className="px-4 py-3.5">
        <span className="tabular inline-flex items-center gap-1.5 text-sm text-foreground">
          <Clock
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          {exchange.localTime}
        </span>
      </td>

      <td className="px-4 py-3.5">
        <span className="tabular text-sm text-muted-foreground">
          {exchange.sessionOpen} – {exchange.sessionClose}
        </span>
      </td>

      <td className="px-4 py-3.5">
        <CountdownCell exchange={exchange} />
      </td>
    </tr>
  );
}

function TableSkeleton() {
  const ids = Array.from({ length: 6 }, (_, i) => `exchange-skeleton-${i}`);
  return (
    <div
      className="divide-y divide-border/60"
      data-ocid="exchange.loading_state"
    >
      {ids.map((id) => (
        <div key={id} className="flex items-center gap-4 px-4 py-4">
          <div className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="hidden h-6 w-20 animate-pulse rounded-full bg-muted sm:block" />
          <div className="hidden h-3.5 w-16 animate-pulse rounded bg-muted md:block" />
        </div>
      ))}
    </div>
  );
}

export function ExchangeHoursTable() {
  const { data, isLoading, isError, isFetching, refetch } = useExchangeHours();

  const exchanges = useMemo(() => sortExchanges(data ?? []), [data]);
  const openCount = exchanges.filter((item) => isOpen(item.status)).length;

  return (
    <section
      data-ocid="exchange.section"
      className="rounded-xl border border-border bg-card shadow-subtle"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Globe2 className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col leading-tight">
            <h2 className="font-display text-base font-bold text-foreground">
              أوقات عمل البورصات
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isLoading
                ? "جارٍ تحميل حالة البورصات…"
                : `${openCount} من ${exchanges.length} بورصة مفتوحة الآن`}
            </p>
          </div>
        </div>

        <button
          type="button"
          data-ocid="exchange.refresh_button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3.5 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={cn("size-4", isFetching && "animate-spin")}
            aria-hidden="true"
          />
          {isFetching ? "جارٍ التحديث…" : "تحديث"}
        </button>
      </header>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div
          data-ocid="exchange.error_state"
          className="flex flex-col items-center gap-3 px-6 py-12 text-center"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Globe2 className="size-6" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted-foreground">
            تعذّر تحميل أوقات عمل البورصات. حاول التحديث مرة أخرى.
          </p>
          <button
            type="button"
            data-ocid="exchange.retry_button"
            onClick={() => void refetch()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-smooth hover:brightness-105"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            إعادة المحاولة
          </button>
        </div>
      ) : exchanges.length === 0 ? (
        <div
          data-ocid="exchange.empty_state"
          className="flex flex-col items-center gap-2 px-6 py-12 text-center"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Globe2 className="size-6" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted-foreground">
            لا تتوفر بيانات عن البورصات حالياً.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            data-ocid="exchange.table"
            className="w-full min-w-[720px] border-collapse text-right"
          >
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-semibold">
                  البورصة
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  الحالة
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  التوقيت المحلي
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  جلسة التداول
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  الحدث القادم
                </th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((exchange, index) => (
                <ExchangeRow
                  key={exchange.code}
                  exchange={exchange}
                  index={index}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFetching && !isLoading && (
        <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          جارٍ تحديث البيانات…
        </div>
      )}
    </section>
  );
}

export default ExchangeHoursTable;
