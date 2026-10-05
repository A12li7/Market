import { useMarketNews } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { type NewsItem, formatRelativeTime } from "@/types";
import {
  ArrowUpLeft,
  ExternalLink,
  Loader2,
  Newspaper,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface NewsPanelProps {
  /** Keyword the panel defaults to, e.g. the currently selected asset symbol. */
  defaultKeyword?: string;
  /** Number of headlines to request from the backend. */
  limit?: number;
}

const NEWS_LIMIT = 12;

/** One headline row: title, source, relative time, opens the source in a new tab. */
function NewsRow({ item, index }: { item: NewsItem; index: number }) {
  return (
    <li data-ocid={`news.item.${index + 1}`}>
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        data-ocid={`news.link.${index + 1}`}
        className="group flex items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition-smooth hover:border-border hover:bg-secondary/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Newspaper className="size-4" aria-hidden="true" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-smooth group-hover:text-primary">
            {item.title}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-0.5 font-medium">
              {item.source}
            </span>
            <span aria-hidden="true">·</span>
            <time className="tabular">
              {formatRelativeTime(item.publishedAt)}
            </time>
          </span>
        </span>

        <ExternalLink
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-smooth group-hover:text-primary"
          aria-hidden="true"
        />
      </a>
    </li>
  );
}

/** Skeleton rows matched to the real row layout while the first fetch runs. */
function NewsSkeleton() {
  return (
    <ul
      data-ocid="news.loading_state"
      aria-hidden="true"
      className="flex flex-col gap-1"
    >
      {Array.from({ length: 5 }, (_, i) => `news-skeleton-${i}`).map((id) => (
        <li key={id} className="flex items-start gap-3 px-3 py-3">
          <span className="size-8 shrink-0 animate-pulse rounded-md bg-secondary" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="h-3.5 w-4/5 animate-pulse rounded bg-secondary" />
            <span className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Financial news panel: latest headlines from the backend, keyword search,
 * manual refresh, and a clear empty state. Fully Arabic RTL.
 */
export function NewsPanel({
  defaultKeyword = "",
  limit = NEWS_LIMIT,
}: NewsPanelProps) {
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [appliedKeyword, setAppliedKeyword] = useState(defaultKeyword);

  // Follow the selected asset when it changes, unless the user typed their own.
  useEffect(() => {
    setKeyword(defaultKeyword);
    setAppliedKeyword(defaultKeyword);
  }, [defaultKeyword]);

  const newsQuery = useMarketNews(appliedKeyword, limit);
  const items = newsQuery.data ?? [];
  const isRefreshing = newsQuery.isFetching;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedKeyword(keyword.trim());
  }

  function handleClear() {
    setKeyword("");
    setAppliedKeyword("");
  }

  function handleRefresh() {
    void newsQuery.refetch();
  }

  const hasKeyword = appliedKeyword.trim().length > 0;

  return (
    <section
      data-ocid="news.panel"
      aria-labelledby="news-panel-title"
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Newspaper className="size-4 text-accent" aria-hidden="true" />
          <h2
            id="news-panel-title"
            className="font-display text-sm font-bold text-foreground"
          >
            الأخبار المالية
          </h2>
        </div>

        <button
          type="button"
          data-ocid="news.refresh_button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="تحديث الأخبار"
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={cn("size-3.5", isRefreshing && "animate-spin")}
            aria-hidden="true"
          />
          تحديث
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <label htmlFor="news-keyword" className="sr-only">
          ابحث في الأخبار بكلمة مفتاحية
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="news-keyword"
            type="search"
            autoComplete="off"
            data-ocid="news.search_input"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="ابحث بكلمة مفتاحية مثل gold"
            className="h-11 w-full rounded-lg border border-input bg-secondary/60 pe-10 ps-10 text-sm text-foreground outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {keyword.length > 0 && (
            <button
              type="button"
              data-ocid="news.clear_button"
              onClick={handleClear}
              aria-label="مسح البحث"
              className="absolute start-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {newsQuery.isLoading ? (
        <NewsSkeleton />
      ) : newsQuery.isError ? (
        <div
          data-ocid="news.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-8 text-center"
        >
          <p className="text-sm text-destructive-foreground">
            تعذّر تحميل الأخبار. تحقّق من الاتصال ثم أعد المحاولة.
          </p>
          <button
            type="button"
            data-ocid="news.retry_button"
            onClick={handleRefresh}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-smooth hover:bg-secondary"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : items.length === 0 ? (
        <div
          data-ocid="news.empty_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Newspaper className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-display text-base font-bold text-foreground">
            لا توجد أخبار مطابقة
          </h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            {hasKeyword
              ? `لم نعثر على عناوين تطابق «${appliedKeyword}». جرّب كلمة أخرى أو امسح البحث لعرض آخر الأخبار.`
              : "لا توجد عناوين متاحة حالياً. اضغط تحديث للمحاولة مرة أخرى."}
          </p>
          {hasKeyword && (
            <button
              type="button"
              data-ocid="news.empty_reset_button"
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-smooth hover:bg-secondary"
            >
              <ArrowUpLeft className="size-3.5" aria-hidden="true" />
              عرض كل الأخبار
            </button>
          )}
        </div>
      ) : (
        <ul
          data-ocid="news.list"
          className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto"
        >
          {items.map((item, index) => (
            <NewsRow key={item.url} item={item} index={index} />
          ))}
        </ul>
      )}

      {isRefreshing && !newsQuery.isLoading && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          جارٍ التحديث…
        </p>
      )}
    </section>
  );
}

export default NewsPanel;
