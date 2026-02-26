export interface User {
    id: string;
    fullName: string;
    email: string;
    role?: 'user' | 'vendor';
    mobile: string;
    agreementTabEnabled?: boolean;
    agreementCompletedAt?: string | null;
    profileComplete?: boolean;
    profileProgress?: number;
    missingFields?: string[];
    whatsapp?: string;
    taxId: string;
    nationalId: string;
    token?: string;

    // Agent Control Flags
    isDisabled?: boolean;
    activeMarqueeNotice?: string | null;
    lastLoginAt?: string;
    assignedAgentName?: string;
}
