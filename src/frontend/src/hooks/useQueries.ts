import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AnalysisRecord,
  AnalysisResult,
  AssetSuggestion,
  Candle,
  ExchangeHours,
  IndicatorSet,
  NewsItem,
} from "../backend";
import { createActor } from "../backend";
import type { AssetType, Interval } from "../types";

/** Extract the Arabic message from any backend error variant. */
function backendErrorMessage(err: {
  __kind__: string;
  invalidInput?: string;
  upstream?: string;
  notFound?: string;
  unauthorized?: string;
}): string {
  if (err.__kind__ === "invalidInput") return err.invalidInput ?? "";
  if (err.__kind__ === "upstream") return err.upstream ?? "";
  if (err.__kind__ === "notFound") return err.notFound ?? "";
  if (err.__kind__ === "unauthorized") return err.unauthorized ?? "";
  return "";
}

/** Search stocks and cryptocurrencies by name or symbol. */
export function useSearchAssets(term: string) {
  const { actor, isFetching } = useActor(createActor);
  const trimmed = term.trim();

  return useQuery<AssetSuggestion[]>({
    queryKey: ["assets", "search", trimmed],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchAssets(trimmed);
    },
    enabled: !!actor && !isFetching && trimmed.length > 0,
  });
}

/** Fetch OHLC candles for an asset and interval. */
export function useGetCandles(
  symbol: string,
  assetType: AssetType,
  interval: Interval,
  enabled = true,
) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<Candle[]>({
    queryKey: ["candles", symbol, assetType, interval],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getCandles(symbol, assetType, interval);
      if (result.__kind__ === "err")
        throw new Error(backendErrorMessage(result.err));
      return result.ok;
    },
    enabled: !!actor && !isFetching && enabled && symbol.length > 0,
  });
}

/** Compute technical indicators for an asset and interval. */
export function useGetIndicators(
  symbol: string,
  assetType: AssetType,
  interval: Interval,
  enabled = true,
) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<IndicatorSet>({
    queryKey: ["indicators", symbol, assetType, interval],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.getIndicators(symbol, assetType, interval);
      if (result.__kind__ === "err")
        throw new Error(backendErrorMessage(result.err));
      return result.ok;
    },
    enabled: !!actor && !isFetching && enabled && symbol.length > 0,
  });
}

/** Generate an AI analysis, persist it, and return the full result. */
export function useGenerateAnalysis() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<
    AnalysisResult,
    Error,
    { symbol: string; assetType: AssetType; interval: Interval }
  >({
    mutationFn: async (request) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.generateAnalysis(request);
      if (result.__kind__ === "err")
        throw new Error(backendErrorMessage(result.err));
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
  });
}

/** List the caller's saved analyses, newest first. */
export function useListAnalyses() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<AnalysisRecord[]>({
    queryKey: ["analyses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAnalyses();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch one saved analysis by id. */
export function useGetAnalysis(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<AnalysisRecord | null>({
    queryKey: ["analysis", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getAnalysis(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/** Delete one saved analysis by id. */
export function useDeleteAnalysis() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<void, Error, bigint>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.deleteAnalysis(id);
      if (result.__kind__ === "err") throw new Error(result.err.notFound);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
  });
}

/** Fetch the latest financial news, optionally filtered by a keyword. */
export function useMarketNews(keyword: string, limit: number) {
  const { actor, isFetching } = useActor(createActor);
  const trimmed = keyword.trim();

  return useQuery<NewsItem[]>({
    queryKey: ["news", trimmed, limit],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getMarketNews(
        trimmed.length > 0 ? trimmed : null,
        BigInt(limit),
      );
      if (result.__kind__ === "err")
        throw new Error(backendErrorMessage(result.err));
      return result.ok;
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch the world's major exchanges with their current trading status. */
export function useExchangeHours() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<ExchangeHours[]>({
    queryKey: ["exchange-hours"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getExchangeHours();
      if (result.__kind__ === "err")
        throw new Error(backendErrorMessage(result.err));
      return result.ok;
    },
    enabled: !!actor && !isFetching,
  });
}
