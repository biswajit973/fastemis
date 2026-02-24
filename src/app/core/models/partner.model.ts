export interface Partner {
    id: string;
    name: string;
    slug: string;
    status: 'active' | 'busy' | 'unavailable';
    rating: number;
    review_count: number;
    tagline: string;
    max_amount: number;
    processing_fee: number;
    tenure_options: number[];
    founded_year: number;
    nbfc_registered: boolean;
    rbi_approved: boolean;
    color: string; // Generated avatar color
}
