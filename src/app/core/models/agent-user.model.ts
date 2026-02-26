export type AgentFieldStatusType = 'filled' | 'not_filled_yet' | 'not_required';

export interface AgentFieldStatus {
    key: string;
    label: string;
    value: string;
    status: AgentFieldStatusType;
}

export interface AgentUserLocation {
    latitude: number | null;
    longitude: number | null;
    accuracy_m: number | null;
    captured_at: string | null;
    maps_url: string;
}

export interface AgentUserSummary {
    id: string;
    full_name: string;
    email: string;
    mobile_number: string;
    requested_amount: string;
    marital_status: string;
    is_active: boolean;
    is_chat_favorite?: boolean;
    agreement_tab_enabled?: boolean;
    agreement_completed_at?: string | null;
    last_location?: AgentUserLocation;
    last_login: string | null;
    profile_complete: boolean;
    profile_progress: number;
    missing_fields: string[];
    filled_fields_count: number;
    total_required_fields: number;
}

export interface AgentUserDetail extends AgentUserSummary {
    field_statuses: AgentFieldStatus[];
}

export interface AgentUsersResponse {
    users: AgentUserSummary[];
}

export interface AgentUserDetailResponse {
    user: AgentUserDetail;
}
