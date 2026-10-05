import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

// Replaces the retired hair-salon state with the chart-analysis state.
// OldActor mirrors the NewActor of the previous chain entry
// (20250101_000000_Init.mo); every retired field is consumed and dropped.
module {
  type DayHours = { days : Text; hours : Text };
  type BusinessInfo = {
    name : Text;
    tagline : Text;
    phone : Text;
    email : Text;
    address : Text;
    openingHours : [DayHours];
  };
  type Service = { id : Nat; name : Text; description : Text; price : Text; duration : Text };
  type TeamMember = { id : Nat; name : Text; role : Text; bio : Text; photo : Text };
  type Testimonial = { id : Nat; author : Text; quote : Text };
  type GalleryImage = { id : Nat; url : Text; caption : Text };
  type BookingRequest = {
    id : Nat;
    name : Text;
    contact : Text;
    service : Text;
    preferredTime : Text;
    message : Text;
    createdAt : Int;
    handled : Bool;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    businessInfo : BusinessInfo;
    services : [Service];
    team : [TeamMember];
    testimonials : [Testimonial];
    gallery : [GalleryImage];
    bookingRequests : Map.Map<Nat, BookingRequest>;
    var nextRequestId : Nat;
  };

  type AssetType = { #stock; #crypto };
  type Interval = { #daily; #weekly; #monthly };
  type MacdCrossover = { #bullish; #bearish; #none };
  type Recommendation = { #buy; #sell; #wait };
  type AnalysisRecord = {
    id : Nat;
    symbol : Text;
    assetName : Text;
    assetType : AssetType;
    interval : Interval;
    createdAt : Nat;
    priceAtAnalysis : Float;
    analysisText : Text;
    recommendation : Recommendation;
    confidence : Nat;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    analyses : Map.Map<Nat, AnalysisRecord>;
    owners : Map.Map<Nat, Principal>;
    state : { var nextAnalysisId : Nat };
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      analyses = Map.empty();
      owners = Map.empty();
      state = { var nextAnalysisId = 0 };
    };
  };
};
