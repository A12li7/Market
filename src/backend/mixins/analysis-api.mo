import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Common "../types/common";
import Types "../types/market";
import MarketLib "../lib/market";
import AnalysisLib "../lib/analysis";
import Inference "../lib/inference";

mixin (
  analyses : Map.Map<Common.AnalysisId, Types.AnalysisRecord>,
  owners : Map.Map<Common.AnalysisId, Principal>,
  state : { var nextAnalysisId : Nat },
  transform : OutCall.Transform,
) {
  /// Fetch price history, compute indicators, generate an Arabic AI analysis,
  /// persist it, and return the full result.
  public shared ({ caller }) func generateAnalysis(request : Types.AnalysisRequest) : async Result.Result<Types.AnalysisResult, Common.Error> {
    if (request.symbol == "") {
      return #err(#invalidInput("الرمز مطلوب"));
    };
    let candles = switch (request.assetType) {
      case (#stock) await MarketLib.fetchStockCandles(request.symbol, request.interval, transform);
      case (#crypto) await MarketLib.fetchCryptoCandles(request.symbol, request.interval, transform);
      case (#forex) await MarketLib.fetchForexCandles(request.symbol, request.interval, transform);
      case (#gold) await MarketLib.fetchMetalCandles(request.symbol, request.interval, transform);
    };
    if (candles.size() == 0) {
      return #err(#upstream("تعذّر جلب بيانات السوق لهذا الرمز"));
    };
    let indicators = MarketLib.computeIndicators(candles);
    let assetName = await MarketLib.lookupAssetName(request.symbol, request.assetType, transform);
    let prompt = MarketLib.buildAnalysisPrompt(request.symbol, assetName, request.interval, candles, indicators);
    let response = try {
      await* Inference.runChat<system>(prompt);
    } catch (_) {
      return #err(#upstream("تعذّر توليد التحليل بالذكاء الاصطناعي"));
    };
    let (recommendation, confidence, analysisText) = MarketLib.parseAnalysisResponse(response);
    let priceAtAnalysis = candles[candles.size() - 1].close;
    let record : Types.AnalysisRecord = {
      id = 0;
      symbol = request.symbol;
      assetName;
      assetType = request.assetType;
      interval = request.interval;
      createdAt = (Time.now() / 1_000_000).toNat();
      priceAtAnalysis;
      analysisText;
      recommendation;
      confidence;
    };
    let id = AnalysisLib.save(analyses, owners, state, caller, record);
    #ok({
      record = { record with id };
      candles;
      indicators;
    });
  };

  /// List the caller's saved analyses, newest first.
  public query ({ caller }) func listAnalyses() : async [Types.AnalysisRecord] {
    AnalysisLib.list(analyses, owners, caller);
  };

  /// Fetch one saved analysis by id (owner only).
  public query ({ caller }) func getAnalysis(id : Common.AnalysisId) : async ?Types.AnalysisRecord {
    AnalysisLib.get(analyses, owners, caller, id);
  };

  /// Delete one saved analysis by id (owner only).
  public shared ({ caller }) func deleteAnalysis(id : Common.AnalysisId) : async Result.Result<(), Common.Error> {
    if (AnalysisLib.remove(analyses, owners, caller, id)) {
      #ok(());
    } else {
      #err(#notFound("التحليل غير موجود"));
    };
  };
};
