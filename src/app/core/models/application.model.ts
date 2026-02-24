export enum ApplicationStatus {
    NEW_UNPAID = 'new_unpaid',          // New Request / Unpaid
    KYC_PAID = 'kyc_paid',              // KYC Done / Paid
    AGREEMENT_PENDING = 'agreement_pending',
    AGREEMENT_DONE = 'agreement_done',
    BGV_IN_PROGRESS = 'bgv_in_progress',
    COMPLETED = 'completed',            // Approved BGV / Completed
    REJECTED = 'rejected'               // Rejected (can happen during BGV)
}

export interface Application {
    id: string;
    partnerId: string;
    userId?: string;
    requestedAmount: number;
    payment_details?: {
        amount: number;
        paymentRoutingId: string;
        expires_at: string;
    };
    status: ApplicationStatus;
    rejectReason?: string;
    createdAt: string;
    updatedAt: string;
}

export const NEXT_STATUS: Record<ApplicationStatus, ApplicationStatus | null> = {
    [ApplicationStatus.NEW_UNPAID]: ApplicationStatus.KYC_PAID,
    [ApplicationStatus.KYC_PAID]: ApplicationStatus.AGREEMENT_PENDING,
    [ApplicationStatus.AGREEMENT_PENDING]: ApplicationStatus.AGREEMENT_DONE,
    [ApplicationStatus.AGREEMENT_DONE]: ApplicationStatus.BGV_IN_PROGRESS,
    [ApplicationStatus.BGV_IN_PROGRESS]: ApplicationStatus.COMPLETED,
    [ApplicationStatus.COMPLETED]: null,
    [ApplicationStatus.REJECTED]: null
};
