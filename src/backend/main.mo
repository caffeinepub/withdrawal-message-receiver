import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Migration "migration";

(with migration = Migration.run)
actor {
  type RequestStatus = {
    #pending;
    #paid;
    #rejected;
  };

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
    status : RequestStatus;
  };

  public type WithdrawalRequestInput = {
    fullName : Text;
    address : Text;
    email : Text;
    contactNo : Text;
    pointsAmount : Nat;
    upiId : Text;
    qrCode : ?Blob;
  };

  public type UpdateStatusInput = {
    id : Nat;
    status : RequestStatus;
  };

  var nextId = 0;

  let requests = Map.empty<Nat, WithdrawalRequest>();

  func getWithdrawalRequestInternal(id : Nat) : WithdrawalRequest {
    switch (requests.get(id)) {
      case (?request) { request };
      case (null) { Runtime.trap("No request found for id " # id.toText()) };
    };
  };

  func createWithdrawalRequest(input : WithdrawalRequestInput) : WithdrawalRequest {
    {
      id = nextId;
      fullName = input.fullName;
      address = input.address;
      email = input.email;
      contactNo = input.contactNo;
      pointsAmount = input.pointsAmount;
      upiId = input.upiId;
      qrCode = input.qrCode;
      timestamp = Time.now();
      status = #pending;
    };
  };

  public shared ({ caller }) func submitWithdrawalRequest(input : WithdrawalRequestInput) : async Nat {
    let request = createWithdrawalRequest(input);
    requests.add(request.id, request);
    nextId += 1;
    request.id;
  };

  public query ({ caller }) func getWithdrawalRequest(id : Nat) : async WithdrawalRequest {
    getWithdrawalRequestInternal(id);
  };

  public query ({ caller }) func getAllWithdrawalRequests() : async [WithdrawalRequest] {
    requests.values().toArray();
  };

  public shared ({ caller }) func updateRequestStatus(input : UpdateStatusInput) : async () {
    let request = getWithdrawalRequestInternal(input.id);
    let updatedRequest : WithdrawalRequest = {
      request with status = input.status;
    };
    requests.add(request.id, updatedRequest);
  };
};
