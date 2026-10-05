import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type AnalysisId = bigint;
export interface AnalysisRecord {
    id: AnalysisId;
    interval: Interval;
    analysisText: string;
    createdAt: Timestamp;
    assetName: string;
    assetType: AssetType;
    recommendation: Recommendation;
    confidence: bigint;
    priceAtAnalysis: number;
    symbol: string;
}
export interface AnalysisRequest {
    interval: Interval;
    assetType: AssetType;
    symbol: string;
}
export interface AnalysisResult {
    candles: Array<Candle>;
    indicators: IndicatorSet;
    record: AnalysisRecord;
}
export interface AssetSuggestion {
    name: string;
    assetType: AssetType;
    symbol: string;
}
export interface Candle {
    low: number;
    high: number;
    close: number;
    open: number;
    volume: number;
    timestamp: Timestamp;
}
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "upstream";
    upstream: string;
} | {
    __kind__: "notFound";
    notFound: string;
} | {
    __kind__: "unauthorized";
    unauthorized: string;
};
export type Error__1 = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface ExchangeHours {
    status: ExchangeStatus;
    localTime: string;
    nextEvent: ExchangeEvent;
    country: string;
    sessionOpen: string;
    code: string;
    nextEventLabel: string;
    name: string;
    sessionClose: string;
    countdownSeconds: bigint;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface IndicatorSet {
    macdSignal?: number;
    macd?: number;
    sma20?: number;
    sma50?: number;
    macdHistogram?: number;
    macdCrossover?: MacdCrossover;
    rsi14?: number;
}
export interface NewsItem {
    url: string;
    title: string;
    source: string;
    publishedAt: Timestamp;
    summary?: string;
}
export type Result = {
    __kind__: "ok";
    ok: Array<NewsItem>;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_1 = {
    __kind__: "ok";
    ok: IndicatorSet;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_2 = {
    __kind__: "ok";
    ok: Array<ExchangeHours>;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_3 = {
    __kind__: "ok";
    ok: Array<Candle>;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_4 = {
    __kind__: "ok";
    ok: AnalysisResult;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_5 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_6 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error__1;
};
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Timestamp = bigint;
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum AssetType {
    forex = "forex",
    gold = "gold",
    stock = "stock",
    crypto = "crypto"
}
export enum ExchangeEvent {
    close = "close",
    open = "open"
}
export enum ExchangeStatus {
    closed = "closed",
    preMarket = "preMarket",
    sessionBreak = "sessionBreak",
    open = "open",
    afterHours = "afterHours",
    holiday = "holiday"
}
export enum Interval {
    monthly = "monthly",
    daily = "daily",
    weekly = "weekly"
}
export enum MacdCrossover {
    bullish = "bullish",
    none = "none",
    bearish = "bearish"
}
export enum Recommendation {
    buy = "buy",
    sell = "sell",
    wait = "wait"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Delete one saved analysis by id (owner only).
     */
    deleteAnalysis(id: AnalysisId): Promise<Result_5>;
    execute(qJson: string): Promise<Result__1>;
    /**
     * / Fetch price history, compute indicators, generate an Arabic AI analysis,
     * / persist it, and return the full result.
     */
    generateAnalysis(request: AnalysisRequest): Promise<Result_4>;
    /**
     * / Fetch one saved analysis by id (owner only).
     */
    getAnalysis(id: AnalysisId): Promise<AnalysisRecord | null>;
    /**
     * / Static Markdown documentation of the backend's public API.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Fetch OHLC candles for an asset and interval.
     */
    getCandles(symbol_: string, assetType: AssetType, interval: Interval): Promise<Result_3>;
    /**
     * / Fetch the world's major exchanges with their current trading status and
     * / the next scheduled open/close event. Read-only: performs an HTTP outcall
     * / to a public exchange-hours source.
     */
    getExchangeHours(): Promise<Result_2>;
    /**
     * / Compute technical indicators for an asset and interval.
     */
    getIndicators(symbol_: string, assetType: AssetType, interval: Interval): Promise<Result_1>;
    /**
     * / Fetch the latest financial news, optionally filtered by a keyword and
     * / capped at `limit` items. Read-only: performs an HTTP outcall to a public
     * / news source.
     */
    getMarketNews(keyword: string | null, limit: bigint): Promise<Result>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the caller's saved analyses, newest first.
     */
    listAnalyses(): Promise<Array<AnalysisRecord>>;
    schema(): Promise<string>;
    /**
     * / Search stocks, cryptocurrencies, forex pairs and precious metals by name
     * / or symbol. This is an update call because it performs HTTP outcalls to
     * / the upstream sources.
     */
    searchAssets(term: string): Promise<Array<AssetSuggestion>>;
    /**
     * / HTTP outcall transform. Strips response headers so the response is
     * / deterministic across replicas.
     */
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
