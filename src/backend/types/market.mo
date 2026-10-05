import Common "common";

module {
  /// Which upstream market data source an asset belongs to.
  public type AssetType = {
    #stock;
    #crypto;
    #forex;
    #gold;
  };

  /// Chart interval requested by the caller.
  public type Interval = {
    #daily;
    #weekly;
    #monthly;
  };

  /// A single OHLC price bar.
  public type Candle = {
    timestamp : Common.Timestamp;
    open : Float;
    high : Float;
    low : Float;
    close : Float;
    volume : Float;
  };

  /// A search suggestion returned by `searchAssets`.
  public type AssetSuggestion = {
    symbol : Text;
    name : Text;
    assetType : AssetType;
  };

  /// Server-computed technical indicators for a candle series.
  public type IndicatorSet = {
    sma20 : ?Float;
    sma50 : ?Float;
    rsi14 : ?Float;
    macd : ?Float;
    macdSignal : ?Float;
    macdHistogram : ?Float;
    macdCrossover : ?MacdCrossover;
  };

  /// MACD crossover state derived from the MACD line vs. its signal line.
  public type MacdCrossover = {
    #bullish;
    #bearish;
    #none;
  };

  /// The recommendation produced by the AI analysis.
  public type Recommendation = {
    #buy;
    #sell;
    #wait;
  };

  /// A persisted AI analysis of one asset chart.
  public type AnalysisRecord = {
    id : Common.AnalysisId;
    symbol : Text;
    assetName : Text;
    assetType : AssetType;
    interval : Interval;
    createdAt : Common.Timestamp;
    priceAtAnalysis : Float;
    analysisText : Text;
    recommendation : Recommendation;
    confidence : Nat;
  };

  /// Input for `generateAnalysis`.
  public type AnalysisRequest = {
    symbol : Text;
    assetType : AssetType;
    interval : Interval;
  };

  /// Full payload returned by `generateAnalysis`.
  public type AnalysisResult = {
    record : AnalysisRecord;
    candles : [Candle];
    indicators : IndicatorSet;
  };

  /// A single financial news item fetched from an external public source.
  public type NewsItem = {
    title : Text;
    source : Text;
    url : Text;
    publishedAt : Common.Timestamp;
    summary : ?Text;
  };

  /// Current trading status of an exchange session.
  public type ExchangeStatus = {
    #open;
    #closed;
    #preMarket;
    #afterHours;
    #sessionBreak;
    #holiday;
  };

  /// The next scheduled open/close event for an exchange.
  public type ExchangeEvent = {
    #open;
    #close;
  };

  /// A stock exchange with its local time, session hours, current status and
  /// the next scheduled open/close event.
  public type ExchangeHours = {
    name : Text;
    code : Text;
    country : Text;
    localTime : Text;
    sessionOpen : Text;
    sessionClose : Text;
    status : ExchangeStatus;
    nextEvent : ExchangeEvent;
    nextEventLabel : Text;
    countdownSeconds : Nat;
  };
};
