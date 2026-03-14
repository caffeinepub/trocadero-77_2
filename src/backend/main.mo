import Map "mo:core/Map";
import Order "mo:core/Order";
import Blob "mo:core/Blob";
import Array "mo:core/Array";
import Timer "mo:core/Timer";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import OutCall "http-outcalls/outcall";

actor {
  type TransformArgs = {
    context : Blob;
    response : OutCall.TransformationOutput;
  };

  public type Signal = {
    id : Text;
    coinName : Text;
    symbol : Text;
    currentPrice : Float;
    entryPrice : Float;
    takeProfit : Float;
    stopLoss : Float;
    confidence : Nat;
    estimatedHours : Nat;
    direction : Direction;
    reasoning : Text;
    profitPercent : Float;
    timestamp : Int;
    hitTarget : Bool;
  };

  public type Direction = {
    #long;
    #short;
  };

  module Direction {
    public func toText(direction : Direction) : Text {
      switch (direction) {
        case (#long) { "long" };
        case (#short) { "short" };
      };
    };

    public func compare(a : Direction, b : Direction) : Order.Order {
      switch (a, b) {
        case (#long, #short) { #less };
        case (#short, #long) { #greater };
        case (_, _) { #equal };
      };
    };
  };

  module Signal {
    public func compare(a : Signal, b : Signal) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  let signals = Map.empty<Text, Signal>();

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func fetchCryptoPrices(symbol : Text) : async Text {
    let endpoint = "https://api.coingecko.com/api/v3/simple/price?ids=" # symbol # "&vs_currencies=usd";
    await OutCall.httpGetRequest(endpoint, [], transform);
  };

  public shared ({ caller }) func addSignal(
    id : Text,
    coinName : Text,
    symbol : Text,
    currentPrice : Float,
    entryPrice : Float,
    takeProfit : Float,
    stopLoss : Float,
    confidence : Nat,
    estimatedHours : Nat,
    direction : Direction,
    reasoning : Text,
  ) : async () {
    let signal : Signal = {
      id;
      coinName;
      symbol;
      currentPrice;
      entryPrice;
      takeProfit;
      stopLoss;
      confidence;
      estimatedHours;
      direction;
      reasoning;
      profitPercent = 0.0;
      timestamp = Time.now();
      hitTarget = false;
    };
    signals.add(id, signal);
  };

  public shared ({ caller }) func updateSignalAccuracy(id : Text, hit : Bool) : async () {
    switch (signals.get(id)) {
      case (null) { Runtime.trap("Signal does not exist!") };
      case (?signal) {
        let updatedSignal = {
          id = signal.id;
          coinName = signal.coinName;
          symbol = signal.symbol;
          currentPrice = signal.currentPrice;
          entryPrice = signal.entryPrice;
          takeProfit = signal.takeProfit;
          stopLoss = signal.stopLoss;
          confidence = signal.confidence;
          estimatedHours = signal.estimatedHours;
          direction = signal.direction;
          reasoning = signal.reasoning;
          profitPercent = signal.profitPercent;
          timestamp = signal.timestamp;
          hitTarget = hit;
        };
        signals.add(id, updatedSignal);
      };
    };
  };

  public query ({ caller }) func getSignals() : async [Signal] {
    signals.values().toArray().sort();
  };

  public query ({ caller }) func getHighProfitSignals() : async [Signal] {
    signals.values().toArray().sort();
  };

  public shared ({ caller }) func rescan() : async () {
    for ((_, signal) in signals.entries()) {
      let updatedPrice = switch (await fetchCryptoPrices(signal.symbol)) {
        case ("") { 0.0 };
        case (_) { 0.0 };
      };

      let updatedSignal = {
        id = signal.id;
        coinName = signal.coinName;
        symbol = signal.symbol;
        currentPrice = updatedPrice;
        entryPrice = signal.entryPrice;
        takeProfit = signal.takeProfit;
        stopLoss = signal.stopLoss;
        confidence = signal.confidence;
        estimatedHours = signal.estimatedHours;
        direction = signal.direction;
        reasoning = signal.reasoning;
        profitPercent = signal.profitPercent;
        timestamp = Time.now();
        hitTarget = signal.hitTarget;
      };
      signals.add(signal.id, updatedSignal);
    };
  };

  public shared ({ caller }) func scheduleRescan() : async () {
    let _ = Timer.setTimer<system>(
      #seconds 86400,
      func() : async () {
        await rescan();
      },
    );
  };
};
