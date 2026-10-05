import Result "mo:core/Result";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Common "../types/common";
import Types "../types/market";
import MarketLib "../lib/market";

mixin (transform : OutCall.Transform) {
  /// Search stocks, cryptocurrencies, forex pairs and precious metals by name
  /// or symbol. This is an update call because it performs HTTP outcalls to
  /// the upstream sources.
  public shared func searchAssets(term : Text) : async [Types.AssetSuggestion] {
    await MarketLib.searchAssets(term, transform);
  };

  /// Fetch OHLC candles for an asset and interval.
  public shared func getCandles(
    symbol : Text,
    assetType : Types.AssetType,
    interval : Types.Interval,
  ) : async Result.Result<[Types.Candle], Common.Error> {
    if (symbol == "") {
      return #err(#invalidInput("الرمز مطلوب"));
    };
    let candles = switch (assetType) {
      case (#stock) await MarketLib.fetchStockCandles(symbol, interval, transform);
      case (#crypto) await MarketLib.fetchCryptoCandles(symbol, interval, transform);
      case (#forex) await MarketLib.fetchForexCandles(symbol, interval, transform);
      case (#gold) await MarketLib.fetchMetalCandles(symbol, interval, transform);
    };
    if (candles.size() == 0) {
      #err(#upstream("تعذّر جلب بيانات السوق لهذا الرمز"));
    } else {
      #ok(candles);
    };
  };

  /// Compute technical indicators for an asset and interval.
  public shared func getIndicators(
    symbol : Text,
    assetType : Types.AssetType,
    interval : Types.Interval,
  ) : async Result.Result<Types.IndicatorSet, Common.Error> {
    if (symbol == "") {
      return #err(#invalidInput("الرمز مطلوب"));
    };
    let candles = switch (assetType) {
      case (#stock) await MarketLib.fetchStockCandles(symbol, interval, transform);
      case (#crypto) await MarketLib.fetchCryptoCandles(symbol, interval, transform);
      case (#forex) await MarketLib.fetchForexCandles(symbol, interval, transform);
      case (#gold) await MarketLib.fetchMetalCandles(symbol, interval, transform);
    };
    if (candles.size() == 0) {
      #err(#upstream("تعذّر جلب بيانات السوق لهذا الرمز"));
    } else {
      #ok(MarketLib.computeIndicators(candles));
    };
  };

  /// Fetch the latest financial news, optionally filtered by a keyword and
  /// capped at `limit` items. Read-only: performs an HTTP outcall to a public
  /// news source.
  public shared func getMarketNews(
    keyword : ?Text,
    limit : Nat,
  ) : async Result.Result<[Types.NewsItem], Common.Error> {
    switch (await MarketLib.fetchMarketNews(keyword, limit, transform)) {
      case (?items) #ok(items);
      case null #err(#upstream("تعذّر جلب الأخبار المالية"));
    };
  };

  /// Fetch the world's major exchanges with their current trading status and
  /// the next scheduled open/close event. Read-only: performs an HTTP outcall
  /// to a public exchange-hours source.
  public shared func getExchangeHours() : async Result.Result<[Types.ExchangeHours], Common.Error> {
    switch (await MarketLib.fetchExchangeHours(transform)) {
      case (?exchanges) #ok(exchanges);
      case null #err(#upstream("تعذّر جلب مواعيد البورصات"));
    };
  };
};
