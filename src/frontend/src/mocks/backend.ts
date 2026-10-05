import type { backendInterface, Candle } from "../backend";
import {
  AssetType,
  ExchangeEvent,
  ExchangeStatus,
  Interval,
  MacdCrossover,
  Recommendation,
} from "../backend";

/** Deterministic pseudo-random generator so the mock is stable across runs. */
function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_TIME = Date.UTC(2025, 0, 1);

/** Build a realistic OHLC series with a gentle uptrend and noise. */
function buildCandles(count: number, startPrice: number, seed: number) {
  const rng = makeRng(seed);
  const candles: Candle[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i += 1) {
    const drift = 0.35;
    const noise = (rng() - 0.5) * 4.2;
    const open = price;
    const close = Math.max(1, open + drift + noise);
    const high = Math.max(open, close) + rng() * 1.8;
    const low = Math.min(open, close) - rng() * 1.8;
    candles.push({
      timestamp: BigInt(BASE_TIME + i * DAY_MS),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.round(1_000_000 + rng() * 5_000_000),
    });
    price = close;
  }
  return candles;
}

const AAPL_CANDLES = buildCandles(120, 182.5, 42);
const BTC_CANDLES = buildCandles(120, 61250, 7);

const ANALYSIS_TEXT = `الاتجاه العام: الاتجاه صاعد على المدى القصير مع تداول السعر فوق المتوسط المتحرك 20 وفوق المتوسط المتحرك 50، ما يدعم استمرار الزخم الإيجابي.

الدعم والمقاومة: يقع الدعم القريب عند 178.40 والمقاومة الأولى عند 196.20. اختراق المقاومة يفتح المجال نحو 204.00، بينما كسر الدعم يعيد اختبار 172.10.

قراءة المؤشرات: مؤشر القوة النسبية عند 58.4 في منطقة محايدة تميل للقوة، والماكد فوق خط الإشارة مع تقاطع صاعد حديث يدعم استمرار الصعود.`;

const RECORDS: Array<{
  id: bigint;
  symbol: string;
  assetName: string;
  assetType: AssetType;
  interval: Interval;
  recommendation: Recommendation;
  confidence: bigint;
  priceAtAnalysis: number;
  createdAt: bigint;
  analysisText: string;
}> = [
  {
    id: BigInt(3),
    symbol: "AAPL",
    assetName: "Apple Inc.",
    assetType: AssetType.stock,
    interval: Interval.daily,
    recommendation: Recommendation.buy,
    confidence: BigInt(78),
    priceAtAnalysis: 191.24,
    createdAt: BigInt(Date.UTC(2025, 0, 12, 9, 30)),
    analysisText: ANALYSIS_TEXT,
  },
  {
    id: BigInt(2),
    symbol: "BTC",
    assetName: "Bitcoin",
    assetType: AssetType.crypto,
    interval: Interval.weekly,
    recommendation: Recommendation.wait,
    confidence: BigInt(61),
    priceAtAnalysis: 62480.5,
    createdAt: BigInt(Date.UTC(2025, 0, 9, 14, 5)),
    analysisText: ANALYSIS_TEXT,
  },
  {
    id: BigInt(1),
    symbol: "TSLA",
    assetName: "Tesla, Inc.",
    assetType: AssetType.stock,
    interval: Interval.daily,
    recommendation: Recommendation.sell,
    confidence: BigInt(54),
    priceAtAnalysis: 248.9,
    createdAt: BigInt(Date.UTC(2025, 0, 6, 11, 45)),
    analysisText: ANALYSIS_TEXT,
  },
];

const SUGGESTIONS = [
  { symbol: "AAPL", name: "Apple Inc.", assetType: AssetType.stock },
  { symbol: "TSLA", name: "Tesla, Inc.", assetType: AssetType.stock },
  { symbol: "MSFT", name: "Microsoft Corporation", assetType: AssetType.stock },
  { symbol: "BTC", name: "Bitcoin", assetType: AssetType.crypto },
  { symbol: "ETH", name: "Ethereum", assetType: AssetType.crypto },
];

function candlesFor(symbol: string) {
  return symbol.toUpperCase() === "BTC" ? BTC_CANDLES : AAPL_CANDLES;
}

const NEWS = [
  {
    title: "الأسهم الأمريكية ترتفع مع ترقب بيانات التضخم",
    source: "رويترز",
    url: "https://example.com/news/1",
    publishedAt: BigInt(Date.now() - 12 * 60 * 1000),
    summary: "صعدت المؤشرات الرئيسية وسط تفاؤل المستثمرين بشأن مسار الفائدة.",
  },
  {
    title: "البيتكوين يتجاوز 62 ألف دولار بعد تدفقات قوية للصناديق",
    source: "بلومبرغ",
    url: "https://example.com/news/2",
    publishedAt: BigInt(Date.now() - 3 * 60 * 60 * 1000),
    summary: "سجلت العملة الرقمية أعلى مستوى في أسبوعين مدعومة بالطلب المؤسسي.",
  },
  {
    title: "الذهب يستقر قرب ذروته مع تراجع عائدات السندات",
    source: "CNBC عربية",
    url: "https://example.com/news/3",
    publishedAt: BigInt(Date.now() - 26 * 60 * 60 * 1000),
    summary: "تتجه الأنظار إلى قرارات البنوك المركزية خلال الأسبوع الجاري.",
  },
  {
    title: "Gold prices climb as investors seek safe havens",
    source: "Reuters",
    url: "https://example.com/news/4",
    publishedAt: BigInt(Date.now() - 40 * 60 * 1000),
    summary:
      "Spot gold rose toward record highs as traders priced in softer rate expectations.",
  },
];

const EXCHANGES = [
  {
    code: "NYSE",
    name: "بورصة نيويورك",
    country: "الولايات المتحدة",
    status: ExchangeStatus.open,
    localTime: "10:30",
    sessionOpen: "09:30",
    sessionClose: "16:00",
    nextEvent: ExchangeEvent.close,
    nextEventLabel: "الإغلاق",
    countdownSeconds: BigInt(5 * 3600 + 30 * 60),
  },
  {
    code: "TADAWUL",
    name: "السوق المالية السعودية",
    country: "السعودية",
    status: ExchangeStatus.closed,
    localTime: "17:30",
    sessionOpen: "10:00",
    sessionClose: "15:00",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(16 * 3600 + 30 * 60),
  },
  {
    code: "LSE",
    name: "بورصة لندن",
    country: "المملكة المتحدة",
    status: ExchangeStatus.preMarket,
    localTime: "08:00",
    sessionOpen: "08:00",
    sessionClose: "16:30",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(30 * 60),
  },
  {
    code: "TSE",
    name: "بورصة طوكيو",
    country: "اليابان",
    status: ExchangeStatus.sessionBreak,
    localTime: "12:00",
    sessionOpen: "09:00",
    sessionClose: "15:00",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(45 * 60),
  },
  {
    code: "HKEX",
    name: "بورصة هونغ كونغ",
    country: "هونغ كونغ",
    status: ExchangeStatus.holiday,
    localTime: "11:00",
    sessionOpen: "09:30",
    sessionClose: "16:00",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(22 * 3600),
  },
  {
    code: "NASDAQ",
    name: "بورصة ناسداك",
    country: "الولايات المتحدة",
    status: ExchangeStatus.open,
    localTime: "10:30",
    sessionOpen: "09:30",
    sessionClose: "16:00",
    nextEvent: ExchangeEvent.close,
    nextEventLabel: "الإغلاق",
    countdownSeconds: BigInt(5 * 3600 + 30 * 60),
  },
  {
    code: "EURONEXT",
    name: "يورونكست باريس",
    country: "فرنسا",
    status: ExchangeStatus.closed,
    localTime: "18:00",
    sessionOpen: "09:00",
    sessionClose: "17:30",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(15 * 3600),
  },
  {
    code: "XETRA",
    name: "بورصة فرانكفورت",
    country: "ألمانيا",
    status: ExchangeStatus.preMarket,
    localTime: "08:30",
    sessionOpen: "09:00",
    sessionClose: "17:30",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(30 * 60),
  },
  {
    code: "ASX",
    name: "بورصة أستراليا",
    country: "أستراليا",
    status: ExchangeStatus.afterHours,
    localTime: "17:15",
    sessionOpen: "10:00",
    sessionClose: "16:00",
    nextEvent: ExchangeEvent.close,
    nextEventLabel: "الإغلاق",
    countdownSeconds: BigInt(45 * 60),
  },
  {
    code: "BSE",
    name: "بورصة بومباي",
    country: "الهند",
    status: ExchangeStatus.sessionBreak,
    localTime: "13:30",
    sessionOpen: "09:15",
    sessionClose: "15:30",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(30 * 60),
  },
  {
    code: "KRX",
    name: "بورصة كوريا",
    country: "كوريا الجنوبية",
    status: ExchangeStatus.holiday,
    localTime: "12:00",
    sessionOpen: "09:00",
    sessionClose: "15:30",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(20 * 3600),
  },
  {
    code: "SIX",
    name: "بورصة سويسرا",
    country: "سويسرا",
    status: ExchangeStatus.closed,
    localTime: "18:30",
    sessionOpen: "09:00",
    sessionClose: "17:30",
    nextEvent: ExchangeEvent.open,
    nextEventLabel: "الافتتاح",
    countdownSeconds: BigInt(14 * 3600 + 30 * 60),
  },
  {
    code: "B3",
    name: "بورصة ساو باولو",
    country: "البرازيل",
    status: ExchangeStatus.afterHours,
    localTime: "18:00",
    sessionOpen: "10:00",
    sessionClose: "17:00",
    nextEvent: ExchangeEvent.close,
    nextEventLabel: "الإغلاق",
    countdownSeconds: BigInt(60 * 60),
  },
];

export const mockBackend: backendInterface = {
  __accessControlState: async () => ({}),
  __analyses: async () => ({}),
  __owners: async () => ({}),
  __state: async () => ({}),
  _initialize_access_control: async () => undefined,
  _internet_identity_sign_in_finish: async () => ({
    __kind__: "ok",
    ok: null,
  }),
  _internet_identity_sign_in_start: async () => new Uint8Array(),
  assignCallerUserRole: async () => undefined,
  getCallerUserRole: async () => "user" as never,
  isCallerAdmin: async () => false,
  getApiDoc: async () => "# API",
  schema: async () => "{}",
  execute: async () => ({ hasMore: false, rows: [] }),
  transform: async (input) => ({
    status: input.response.status,
    body: input.response.body,
    headers: [],
  }),

  searchAssets: async (term) => {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return SUGGESTIONS.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q),
    );
  },

  getCandles: async (symbol) => ({
    __kind__: "ok",
    ok: candlesFor(symbol),
  }),

  getIndicators: async () => ({
    __kind__: "ok",
    ok: {
      sma20: 189.42,
      sma50: 184.17,
      rsi14: 58.4,
      macd: 2.31,
      macdSignal: 1.84,
      macdHistogram: 0.47,
      macdCrossover: MacdCrossover.bullish,
    },
  }),

  generateAnalysis: async (request) => {
    const candles = candlesFor(request.symbol);
    const latest = candles[candles.length - 1];
    const nextId =
      RECORDS.reduce((max, r) => (r.id > max ? r.id : max), BigInt(0)) +
      BigInt(1);
    const record = {
      id: nextId,
      symbol: request.symbol,
      assetName:
        SUGGESTIONS.find((s) => s.symbol === request.symbol)?.name ??
        request.symbol,
      assetType: request.assetType,
      interval: request.interval,
      recommendation: Recommendation.buy,
      confidence: BigInt(78),
      priceAtAnalysis: latest.close,
      createdAt: BigInt(Date.now()),
      analysisText: ANALYSIS_TEXT,
    };
    RECORDS.unshift(record);
    return {
      __kind__: "ok",
      ok: { candles, indicators: {
        sma20: 189.42,
        sma50: 184.17,
        rsi14: 58.4,
        macd: 2.31,
        macdSignal: 1.84,
        macdHistogram: 0.47,
        macdCrossover: MacdCrossover.bullish,
      }, record },
    };
  },

  listAnalyses: async () => RECORDS,
  getAnalysis: async (id) => RECORDS.find((r) => r.id === id) ?? null,
  deleteAnalysis: async () => ({ __kind__: "ok", ok: null }),

  getMarketNews: async (keyword, limit) => {
    const q = keyword?.trim().toLowerCase() ?? "";
    const items = NEWS.filter(
      (item) =>
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q),
    );
    return { __kind__: "ok", ok: items.slice(0, Number(limit)) };
  },

  getExchangeHours: async () => ({ __kind__: "ok", ok: EXCHANGES }),
};

export default mockBackend;
