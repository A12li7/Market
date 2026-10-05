module {
  /// Milliseconds since the Unix epoch (as returned by `Time.now() / 1_000_000`).
  public type Timestamp = Nat;

  /// Identifier of a persisted analysis record.
  public type AnalysisId = Nat;

  /// A generic failure surfaced to callers as a `Result` error.
  public type Error = {
    #notFound : Text;
    #invalidInput : Text;
    #upstream : Text;
    #unauthorized : Text;
  };
};
