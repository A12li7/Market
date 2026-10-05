import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Common "../types/common";
import Types "../types/market";

module {
  /// Persist a new analysis record and return its assigned id.
  public func save(
    analyses : Map.Map<Common.AnalysisId, Types.AnalysisRecord>,
    owners : Map.Map<Common.AnalysisId, Principal>,
    state : { var nextAnalysisId : Nat },
    owner : Principal,
    record : Types.AnalysisRecord,
  ) : Common.AnalysisId {
    let id = state.nextAnalysisId;
    state.nextAnalysisId := id + 1;
    analyses.add(id, { record with id });
    owners.add(id, owner);
    id;
  };

  /// List the caller's analyses, newest first.
  public func list(
    analyses : Map.Map<Common.AnalysisId, Types.AnalysisRecord>,
    owners : Map.Map<Common.AnalysisId, Principal>,
    caller : Principal,
  ) : [Types.AnalysisRecord] {
    let owned = analyses.entries().filterMap(func((id, record)) {
      switch (owners.get(id)) {
        case (?owner) (if (Principal.equal(owner, caller)) { ?record } else { null });
        case null null;
      };
    }).toArray();
    owned.sort(func(a, b) {
      if (a.createdAt > b.createdAt) { #less }
      else if (a.createdAt < b.createdAt) { #greater }
      else { #equal };
    });
  };

  /// Fetch one analysis by id, enforcing per-caller ownership.
  public func get(
    analyses : Map.Map<Common.AnalysisId, Types.AnalysisRecord>,
    owners : Map.Map<Common.AnalysisId, Principal>,
    caller : Principal,
    id : Common.AnalysisId,
  ) : ?Types.AnalysisRecord {
    switch (owners.get(id)) {
      case (?owner) {
        if (Principal.equal(owner, caller)) { analyses.get(id) } else { null };
      };
      case null null;
    };
  };

  /// Delete one analysis by id, enforcing per-caller ownership.
  public func remove(
    analyses : Map.Map<Common.AnalysisId, Types.AnalysisRecord>,
    owners : Map.Map<Common.AnalysisId, Principal>,
    caller : Principal,
    id : Common.AnalysisId,
  ) : Bool {
    switch (owners.get(id)) {
      case (?owner) {
        if (Principal.equal(owner, caller)) {
          analyses.remove(id);
          owners.remove(id);
          true;
        } else {
          false;
        };
      };
      case null false;
    };
  };
};
