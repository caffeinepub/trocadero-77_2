import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Signal {
    id: string;
    currentPrice: number;
    direction: Direction;
    takeProfit: number;
    reasoning: string;
    stopLoss: number;
    estimatedHours: bigint;
    timestamp: bigint;
    coinName: string;
    entryPrice: number;
    hitTarget: boolean;
    confidence: bigint;
    symbol: string;
    profitPercent: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum Direction {
    long_ = "long",
    short_ = "short"
}
export interface backendInterface {
    addSignal(id: string, coinName: string, symbol: string, currentPrice: number, entryPrice: number, takeProfit: number, stopLoss: number, confidence: bigint, estimatedHours: bigint, direction: Direction, reasoning: string): Promise<void>;
    fetchCryptoPrices(symbol: string): Promise<string>;
    getHighProfitSignals(): Promise<Array<Signal>>;
    getSignals(): Promise<Array<Signal>>;
    rescan(): Promise<void>;
    scheduleRescan(): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateSignalAccuracy(id: string, hit: boolean): Promise<void>;
}
