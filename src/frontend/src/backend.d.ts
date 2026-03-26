import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WithdrawalRequestInput {
    fullName: string;
    email: string;
    address: string;
    upiId: string;
    contactNo: string;
    pointsAmount: bigint;
    qrCode?: Uint8Array;
}
export interface WithdrawalRequest {
    id: bigint;
    status: RequestStatus;
    fullName: string;
    email: string;
    address: string;
    timestamp: bigint;
    upiId: string;
    contactNo: string;
    pointsAmount: bigint;
    qrCode?: Uint8Array;
}
export interface UpdateStatusInput {
    id: bigint;
    status: RequestStatus;
}
export enum RequestStatus {
    pending = "pending",
    paid = "paid",
    rejected = "rejected"
}
export interface backendInterface {
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getWithdrawalRequest(id: bigint): Promise<WithdrawalRequest>;
    submitWithdrawalRequest(input: WithdrawalRequestInput): Promise<bigint>;
    updateRequestStatus(input: UpdateStatusInput): Promise<void>;
}
