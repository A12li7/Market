import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

// Adds forex and gold/precious-metals asset classes. `AssetType` is persisted
// inside every `AnalysisRecord`, so widening the variant requires an explicit
// migration that re-types each stored record. OldActor mirrors the NewActor of
// the previous chain entry (20260101_000000.mo).
module {
  type OldAssetType = { #stock; #crypto };
  type NewAssetType = { #stock; #crypto; #forex; #gold };
  type Interval = { #daily; #weekly; #monthly };
  type Recommendation = { #buy; #sell; #wait };

  type OldAnalysisRecord = {
    id : Nat;
    symbol : Text;
    assetName : Text;
    assetType : OldAssetType;
    interval : Interval;
    createdAt : Nat;
    priceAtAnalysis : Float;
    analysisText : Text;
    recommendation : Recommendation;
    confidence : Nat;
  };

  type NewAnalysisRecord = {
    id : Nat;
    symbol : Text;
    assetName : Text;
    assetType : NewAssetType;
    interval : Interval;
    createdAt : Nat;
    priceAtAnalysis : Float;
    analysisText : Text;
    recommendation : Recommendation;
    confidence : Nat;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    analyses : Map.Map<Nat, OldAnalysisRecord>;
    owners : Map.Map<Nat, Principal>;
    state : { var nextAnalysisId : Nat };
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    analyses : Map.Map<Nat, NewAnalysisRecord>;
    owners : Map.Map<Nat, Principal>;
    state : { var nextAnalysisId : Nat };
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      analyses = old.analyses.map(
        func(_, record) {
          {
            record with
            assetType = record.assetType : NewAssetType;
          };
        }
      );
      owners = old.owners;
      state = old.state;
    };
  };
};
