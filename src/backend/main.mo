import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Common "types/common";
import Types "types/market";
import MarketApi "mixins/market-api";
import AnalysisApi "mixins/analysis-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let analyses : Map.Map<Common.AnalysisId, Types.AnalysisRecord>;
  let owners : Map.Map<Common.AnalysisId, Principal>;
  let state : { var nextAnalysisId : Nat };

  // OQL entity over the persisted analyses. Ownership lives in the separate
  // `owners` map, so the row is built manually from `analyses.entries()` with
  // the owner promoted to a column. `.controllerOrScoped()` lets the platform
  // agent read every row while each signed-in user reads only their own.
  include Expose({
    entities = [
      OQL.Entity.manual<(Common.AnalysisId, Types.AnalysisRecord)>(
        "analysis",
        func() : Iter.Iter<(Common.AnalysisId, Types.AnalysisRecord)> = analyses.entries(),
        "AnalysisRecord",
        "id",
      )
        .sample(
          (
            0,
            {
              id = 0;
              symbol = "";
              assetName = "";
              assetType = #stock;
              interval = #daily;
              createdAt = 0;
              priceAtAnalysis = 0.0;
              analysisText = "";
              recommendation = #wait;
              confidence = 0;
            },
          )
        )
        .payload("id", func((id, _)) = id)
        .payload("symbol", func((_, r)) = r.symbol)
        .payload("assetName", func((_, r)) = r.assetName)
        .payload("assetType", func((_, r)) =
          switch (r.assetType) {
            case (#stock) { "stock" };
            case (#crypto) { "crypto" };
            case (#forex) { "forex" };
            case (#gold) { "gold" };
          }
        )
        .payload("interval", func((_, r)) =
          switch (r.interval) {
            case (#daily) { "daily" };
            case (#weekly) { "weekly" };
            case (#monthly) { "monthly" };
          }
        )
        .payload("createdAt", func((_, r)) = r.createdAt)
        .payload("priceAtAnalysis", func((_, r)) = r.priceAtAnalysis)
        .payload("analysisText", func((_, r)) = r.analysisText)
        .payload("recommendation", func((_, r)) =
          switch (r.recommendation) {
            case (#buy) { "buy" };
            case (#sell) { "sell" };
            case (#wait) { "wait" };
          }
        )
        .payload("confidence", func((_, r)) = r.confidence)
        .payload("owner", func((id, _)) = owners.get(id) ?? Principal.fromText("aaaaa-aa"))
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });

  /// HTTP outcall transform. Strips response headers so the response is
  /// deterministic across replicas.
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  include MarketApi(transform);
  include AnalysisApi(analyses, owners, state, transform);
  include ApiDocMixin();
};
