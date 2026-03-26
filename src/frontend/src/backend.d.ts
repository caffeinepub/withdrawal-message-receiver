import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WithdrawalRequest {
    id: bigint;
    status: string;
    paymentMethod: string;
    username: string;
    bankAccount: string;
    bankHolderName: string;
    upiQrUrl: string;
    uploadedQrBase64: string;
    fullName: string;
    payoutRupees: number;
    bankIfsc: string;
    email: string;
    address: string;
    timestamp: bigint;
    upiId: string;
    phone: string;
    points: bigint;
}
export interface backendInterface {
    getAllWithdrawals(): Promise<Array<WithdrawalRequest>>;
    submitWithdrawal(request: WithdrawalRequest): Promise<bigint>;
    updateWithdrawalStatus(id: bigint, newStatus: string): Promise<boolean>;
}
