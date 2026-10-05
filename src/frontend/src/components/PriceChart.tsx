import type { Candle } from "@/types";
import {
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  createChart,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

export interface IndicatorVisibility {
  sma20: boolean;
  sma50: boolean;
  rsi: boolean;
  macd: boolean;
}

interface PriceChartProps {
  candles: Candle[];
  visibility: IndicatorVisibility;
  loading?: boolean;
}

/** Convert a backend millisecond timestamp to a UNIX seconds value. */
function toSeconds(timestamp: bigint): number {
  return Number(timestamp / 1_000n);
}

/** Rolling simple moving average over the closing prices. */
function rollingSma(candles: Candle[], period: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i += 1) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) out.push(sum / period);
  }
  return out;
}

/** Exponential moving average over a numeric series. */
function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  if (values.length === 0) return out;
  const k = 2 / (period + 1);
  let prev = values[0];
  out.push(prev);
  for (let i = 1; i < values.length; i += 1) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/** MACD line = EMA(fast) − EMA(slow) over closing prices. */
function rollingEma(candles: Candle[], fast: number, slow: number): number[] {
  const closes = candles.map((candle) => candle.close);
  const fastEma = ema(closes, fast);
  const slowEma = ema(closes, slow);
  return closes.map((_, i) => fastEma[i] - slowEma[i]);
}

/** EMA applied to an already-computed series (used for the MACD signal). */
function rollingEmaOf(values: number[], period: number): number[] {
  return ema(values, period);
}

/** Wilder's RSI over the closing prices. */
function rollingRsi(candles: Candle[], period = 14): number[] {
  const out: number[] = [];
  if (candles.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const delta = candles[i].close - candles[i - 1].close;
    if (delta >= 0) gain += delta;
    else loss -= delta;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period + 1; i < candles.length; i += 1) {
    const delta = candles[i].close - candles[i - 1].close;
    const up = delta > 0 ? delta : 0;
    const down = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + up) / period;
    avgLoss = (avgLoss * (period - 1) + down) / period;
    out.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return out;
}

// lightweight-charts' ColorParser only accepts hex/rgb/hsl — never CSS color
// functions. These hex literals mirror the OKLCH design tokens in index.css.
const UP_COLOR = "#37bb62";
const DOWN_COLOR = "#e6424c";
const SMA20_COLOR = "#ebaa2d";
const SMA50_COLOR = "#00bdbe";
const RSI_COLOR = "#a682e1";
const MACD_COLOR = "#60b0ff";
const MACD_SIGNAL_COLOR = "#f17260";
const RSI_ZONE_COLOR = "rgba(129, 135, 141, 0.5)";
const TEXT_COLOR = "#81878d";
const GRID_COLOR = "rgba(34, 41, 51, 0.35)";
const BORDER_COLOR = "#222933";
const CROSSHAIR_COLOR = "rgba(235, 170, 45, 0.6)";
const CROSSHAIR_LABEL_COLOR = "#ebaa2d";

export function PriceChart({ candles, visibility, loading }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const sma20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Create the chart once and keep it responsive.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { color: "transparent" },
        textColor: TEXT_COLOR,
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: GRID_COLOR },
        horzLines: { color: GRID_COLOR },
      },
      rightPriceScale: {
        borderColor: BORDER_COLOR,
      },
      timeScale: {
        borderColor: BORDER_COLOR,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: CROSSHAIR_COLOR,
          labelBackgroundColor: CROSSHAIR_LABEL_COLOR,
        },
        horzLine: {
          color: CROSSHAIR_COLOR,
          labelBackgroundColor: CROSSHAIR_LABEL_COLOR,
        },
      },
      localization: {
        locale: "ar",
      },
      autoSize: true,
    });

    chartRef.current = chart;
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });
    sma20Ref.current = chart.addSeries(LineSeries, {
      color: SMA20_COLOR,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    sma50Ref.current = chart.addSeries(LineSeries, {
      color: SMA50_COLOR,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    rsiRef.current = chart.addSeries(LineSeries, {
      color: RSI_COLOR,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: "rsi",
    });
    rsiUpperRef.current = chart.addSeries(LineSeries, {
      color: RSI_ZONE_COLOR,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: "rsi",
    });
    rsiLowerRef.current = chart.addSeries(LineSeries, {
      color: RSI_ZONE_COLOR,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: "rsi",
    });
    macdRef.current = chart.addSeries(LineSeries, {
      color: MACD_COLOR,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: "macd",
    });
    macdSignalRef.current = chart.addSeries(LineSeries, {
      color: MACD_SIGNAL_COLOR,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: "macd",
    });
    chart.priceScale("rsi").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
      borderColor: BORDER_COLOR,
    });
    chart.priceScale("macd").applyOptions({
      scaleMargins: { top: 0.6, bottom: 0.22 },
      borderColor: BORDER_COLOR,
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      sma20Ref.current = null;
      sma50Ref.current = null;
      rsiRef.current = null;
      rsiUpperRef.current = null;
      rsiLowerRef.current = null;
      macdRef.current = null;
      macdSignalRef.current = null;
    };
  }, []);

  // Feed candle data.
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;
    const data = candles
      .map((candle) => ({
        time: toSeconds(candle.timestamp) as never,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));
    series.setData(data);
    if (data.length > 0) chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Feed SMA overlays across the full candle series.
  useEffect(() => {
    const sma20 = sma20Ref.current;
    const sma50 = sma50Ref.current;
    if (!sma20 || !sma50) return;

    const times = candles.map((candle) => toSeconds(candle.timestamp));

    if (visibility.sma20) {
      const values = rollingSma(candles, 20);
      const offset = candles.length - values.length;
      sma20.setData(
        values.map((value, i) => ({
          time: times[offset + i] as never,
          value,
        })),
      );
    } else {
      sma20.setData([]);
    }

    if (visibility.sma50) {
      const values = rollingSma(candles, 50);
      const offset = candles.length - values.length;
      sma50.setData(
        values.map((value, i) => ({
          time: times[offset + i] as never,
          value,
        })),
      );
    } else {
      sma50.setData([]);
    }
  }, [candles, visibility.sma20, visibility.sma50]);

  // Feed RSI panel with the full series plus 70/30 reference lines.
  useEffect(() => {
    const rsi = rsiRef.current;
    const upper = rsiUpperRef.current;
    const lower = rsiLowerRef.current;
    if (!rsi || !upper || !lower) return;

    const times = candles.map((candle) => toSeconds(candle.timestamp));

    if (visibility.rsi) {
      const values = rollingRsi(candles, 14);
      const offset = candles.length - values.length;
      rsi.setData(
        values.map((value, i) => ({
          time: times[offset + i] as never,
          value,
        })),
      );
      upper.setData(times.map((time) => ({ time: time as never, value: 70 })));
      lower.setData(times.map((time) => ({ time: time as never, value: 30 })));
    } else {
      rsi.setData([]);
      upper.setData([]);
      lower.setData([]);
    }
  }, [candles, visibility.rsi]);

  // Feed MACD panel with the full series.
  useEffect(() => {
    const macd = macdRef.current;
    const signal = macdSignalRef.current;
    if (!macd || !signal) return;

    const times = candles.map((candle) => toSeconds(candle.timestamp));
    const macdValues = rollingEma(candles, 12, 26);
    const signalValues = rollingEmaOf(macdValues, 9);
    const macdOffset = candles.length - macdValues.length;
    const signalOffset = candles.length - signalValues.length;

    if (visibility.macd) {
      macd.setData(
        macdValues.map((value, i) => ({
          time: times[macdOffset + i] as never,
          value,
        })),
      );
      signal.setData(
        signalValues.map((value, i) => ({
          time: times[signalOffset + i] as never,
          value,
        })),
      );
    } else {
      macd.setData([]);
      signal.setData([]);
    }
  }, [candles, visibility.macd]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        data-ocid="chart.canvas_target"
        className="h-[320px] w-full sm:h-[420px]"
      />
      {loading && (
        <div
          data-ocid="chart.loading_state"
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm"
        >
          <span className="text-sm text-muted-foreground">
            جارٍ تحميل بيانات الشارت…
          </span>
        </div>
      )}
      {!loading && candles.length === 0 && (
        <div
          data-ocid="chart.empty_state"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-sm text-muted-foreground">
            لا توجد بيانات لعرضها لهذا الأصل.
          </span>
        </div>
      )}
    </div>
  );
}

export default PriceChart;
