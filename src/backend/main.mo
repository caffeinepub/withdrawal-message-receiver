import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";

actor {
  type WithdrawalRequest = {
    id : Nat;
    username : Text;
    fullName : Text;
    address : Text;
    email : Text;
    phone : Text;
    points : Nat;
    payoutRupees : Float;
    paymentMethod : Text;
    upiId : Text;
    upiQrUrl : Text;
    uploadedQrBase64 : Text;
    bankAccount : Text;
    bankIfsc : Text;
    bankHolderName : Text;
    timestamp : Int;
    status : Text;
  };

  var nextId = 1;

  let withdrawals = Map.empty<Nat, WithdrawalRequest>();

  public shared ({ caller }) func submitWithdrawal(request : WithdrawalRequest) : async Nat {
    let newId = nextId;
    let newRequest : WithdrawalRequest = {
      request with
      id = newId;
      timestamp = Time.now();
      status = "pending";
    };
    withdrawals.add(newId, newRequest);
    nextId += 1;
    newId;
  };

  public query ({ caller }) func getAllWithdrawals() : async [WithdrawalRequest] {
    withdrawals.values().toArray();
  };

  public shared ({ caller }) func updateWithdrawalStatus(id : Nat, newStatus : Text) : async Bool {
    switch (withdrawals.get(id)) {
      case (null) { false };
      case (?request) {
        let updatedRequest : WithdrawalRequest = {
          request with status = newStatus;
        };
        withdrawals.add(id, updatedRequest);
        true;
      };
    };
  };
};
