import { useSearchAssets } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { ASSET_TYPE_LABELS, type AssetSuggestion, AssetType } from "@/types";
import {
  Bitcoin,
  Coins,
  DollarSign,
  LineChart,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

interface AssetSearchProps {
  onSelect: (asset: AssetSuggestion) => void;
  selectedSymbol?: string;
}

const DEBOUNCE_MS = 350;

/** Icon + color treatment per asset class, distinct for each of the four. */
const ASSET_TYPE_STYLES: Record<
  AssetType,
  { icon: typeof TrendingUp; className: string }
> = {
  [AssetType.stock]: {
    icon: TrendingUp,
    className: "bg-primary/15 text-primary",
  },
  [AssetType.crypto]: {
    icon: Bitcoin,
    className: "bg-accent/15 text-accent",
  },
  [AssetType.forex]: {
    icon: DollarSign,
    className: "bg-chart-5/15 text-chart-5",
  },
  [AssetType.gold]: {
    icon: Coins,
    className: "bg-warning/15 text-warning",
  },
};

export function AssetSearch({ onSelect, selectedSymbol }: AssetSearchProps) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const resultsId = `${inputId}-results`;

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(term.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [term]);

  const { data: suggestions = [], isFetching } = useSearchAssets(debounced);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSelect(asset: AssetSuggestion) {
    onSelect(asset);
    setTerm("");
    setDebounced("");
    setOpen(false);
  }

  const showPanel = open && debounced.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        ابحث عن أصل مالي
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          aria-controls={resultsId}
          aria-expanded={showPanel}
          aria-autocomplete="list"
          data-ocid="asset.search_input"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="مثال: AAPL أو bitcoin"
          className="h-12 w-full rounded-lg border border-input bg-secondary/60 pe-10 ps-4 text-sm text-foreground outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {isFetching && (
          <Loader2
            className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-accent"
            aria-hidden="true"
          />
        )}
      </div>

      {showPanel && (
        <ul
          id={resultsId}
          data-ocid="asset.search_results"
          className="absolute z-30 mt-2 max-h-80 w-full list-none overflow-y-auto rounded-lg border border-border bg-popover p-1.5 shadow-elevated"
        >
          {isFetching && suggestions.length === 0 && (
            <li
              data-ocid="asset.search_loading"
              className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              جارٍ البحث…
            </li>
          )}

          {!isFetching && suggestions.length === 0 && (
            <li
              data-ocid="asset.search_empty"
              className="px-3 py-4 text-center text-sm text-muted-foreground"
            >
              لا توجد نتائج مطابقة. جرّب رمزاً آخر مثل TSLA أو ethereum.
            </li>
          )}

          {suggestions.map((asset, index) => {
            const style = ASSET_TYPE_STYLES[asset.assetType];
            const Icon = style.icon;
            const active = asset.symbol === selectedSymbol;
            return (
              <li key={`${asset.assetType}-${asset.symbol}`}>
                <button
                  type="button"
                  aria-current={active ? "true" : undefined}
                  data-ocid={`asset.search_result.${index + 1}`}
                  onClick={() => handleSelect(asset)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start transition-smooth",
                    active ? "bg-primary/10" : "hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md",
                      style.className,
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {asset.name}
                    </span>
                    <span className="tabular text-xs text-muted-foreground">
                      {asset.symbol}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {ASSET_TYPE_LABELS[asset.assetType]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <LineChart className="size-3.5" aria-hidden="true" />
        أسهم وعملات رقمية وفوركس وذهب — اكتب للبحث الفوري
      </p>
    </div>
  );
}

export default AssetSearch;
