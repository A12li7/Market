import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";

// Generated initial migration: seeds all stable actor state on a fresh
// install. Actor type definitions are inlined so this frozen chain entry
// does not drift if the actor's types change in a later version.
module {
  type DayHours = {
    days : Text;
    hours : Text;
  };

  type BusinessInfo = {
    name : Text;
    tagline : Text;
    phone : Text;
    email : Text;
    address : Text;
    openingHours : [DayHours];
  };

  type Service = {
    id : Nat;
    name : Text;
    description : Text;
    price : Text;
    duration : Text;
  };

  type TeamMember = {
    id : Nat;
    name : Text;
    role : Text;
    bio : Text;
    photo : Text;
  };

  type Testimonial = {
    id : Nat;
    author : Text;
    quote : Text;
  };

  type GalleryImage = {
    id : Nat;
    url : Text;
    caption : Text;
  };

  type BookingRequest = {
    id : Nat;
    name : Text;
    contact : Text;
    service : Text;
    preferredTime : Text;
    message : Text;
    createdAt : Time.Time;
    handled : Bool;
  };

  public func migration(_ : {}) : {
    accessControlState : AccessControl.AccessControlState;
    businessInfo : BusinessInfo;
    services : [Service];
    team : [TeamMember];
    testimonials : [Testimonial];
    gallery : [GalleryImage];
    bookingRequests : Map.Map<Nat, BookingRequest>;
    var nextRequestId : Nat;
  } {
    {
      accessControlState = AccessControl.initState();
      businessInfo = {
        name = "Maple & Main";
        tagline = "A neighborhood hair studio on Maple Street";
        phone = "(503) 555-0182";
        email = "hello@mapleandmain.salon";
        address = "214 Maple Street, Portland, OR 97214";
        openingHours = [
          { days = "Tuesday - Friday"; hours = "9:00 am - 7:00 pm" },
          { days = "Saturday"; hours = "9:00 am - 2:00 pm" },
          { days = "Sunday - Monday"; hours = "Closed" },
        ];
      };
      services = [
        {
          id = 0;
          name = "Cut & style";
          description = "Consultation, precision cut, wash, and a finished style.";
          price = "$65";
          duration = "60 min";
        },
        {
          id = 1;
          name = "Short cut & beard trim";
          description = "Clipper or scissor cut with a hot-towel beard tidy-up.";
          price = "$38";
          duration = "45 min";
        },
        {
          id = 2;
          name = "Kids' cut";
          description = "A patient, gentle cut for guests twelve and under.";
          price = "$28";
          duration = "30 min";
        },
        {
          id = 3;
          name = "Full color";
          description = "Single-process color from roots to ends, with gloss.";
          price = "from $120";
          duration = "2 hrs";
        },
        {
          id = 4;
          name = "Balayage & highlights";
          description = "Hand-painted dimension, toner, and a blowout to finish.";
          price = "from $160";
          duration = "2.5 hrs";
        },
        {
          id = 5;
          name = "Blowout";
          description = "Wash, blow-dry, and styling for any occasion.";
          price = "$40";
          duration = "45 min";
        },
        {
          id = 6;
          name = "Updo & event styling";
          description = "Polished styling for weddings, proms, and photos.";
          price = "from $75";
          duration = "60 min";
        },
        {
          id = 7;
          name = "Deep conditioning";
          description = "Restorative treatment with scalp massage.";
          price = "$35";
          duration = "30 min";
        },
      ];
      team = [
        {
          id = 0;
          name = "Maya Ellison";
          role = "Owner & master stylist";
          bio = "Maya opened Maple & Main in 2016 after a decade behind the chair downtown. Precision cuts and lived-in color are her thing.";
          photo = "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=640";
        },
        {
          id = 1;
          name = "Jordan Blake";
          role = "Colorist";
          bio = "Balayage specialist. Jordan turns grown-out color into something you will want to keep forever.";
          photo = "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=640";
        },
        {
          id = 2;
          name = "Priya Nair";
          role = "Stylist";
          bio = "Short cuts, curls, and kids are Priya's speciality. Ten years of making first haircuts feel easy.";
          photo = "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=640";
        },
      ];
      testimonials = [
        {
          id = 0;
          author = "Rachel T.";
          quote = "Maya listened to what I wanted and then made it better. Best haircut I have had in years.";
        },
        {
          id = 1;
          author = "Dan M.";
          quote = "Walked in with grown-out color from another salon, walked out looking like myself again. Jordan is a magician.";
        },
        {
          id = 2;
          author = "Sofia K.";
          quote = "They got my daughter through her first real haircut without a single tear. We are regulars now.";
        },
      ];
      gallery = [
        {
          id = 0;
          url = "https://images.pexels.com/photos/3993310/pexels-photo-3993310.jpeg?auto=compress&cs=tinysrgb&w=1200";
          caption = "Behind the chair";
        },
        {
          id = 1;
          url = "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1200";
          caption = "Finished curls";
        },
        {
          id = 2;
          url = "https://images.pexels.com/photos/705255/pexels-photo-705255.jpeg?auto=compress&cs=tinysrgb&w=1200";
          caption = "The studio floor";
        },
        {
          id = 3;
          url = "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200";
          caption = "Wash and treatment";
        },
        {
          id = 4;
          url = "https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1200";
          caption = "Tools of the trade";
        },
        {
          id = 5;
          url = "https://images.pexels.com/photos/3992870/pexels-photo-3992870.jpeg?auto=compress&cs=tinysrgb&w=1200";
          caption = "Ready for the day";
        },
      ];
      bookingRequests = Map.empty<Nat, BookingRequest>();
      var nextRequestId = 0;
    };
  };
};
