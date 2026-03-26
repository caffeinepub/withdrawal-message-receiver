import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type WithdrawalRequest = {
    id : Nat;
    fullName : Text;
    address : Text;
    email : Text;
    contactNo : Text;
    pointsAmount : Nat;
    upiId : Text;
    qrCode : ?Blob;
    timestamp : Int;
    status : {
      #pending;
      #paid;
      #rejected;
    };
  };

  type OldActor = {};
  type NewActor = {
    requests : Map.Map<Nat, WithdrawalRequest>;
    nextId : Nat;
  };

  public func run(_old : OldActor) : NewActor {
    {
      requests = Map.empty<Nat, WithdrawalRequest>();
      nextId = 0;
    };
  };
};
