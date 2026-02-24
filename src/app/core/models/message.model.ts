export interface Message {
    id: string;
    applicationId: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
    read: boolean;
}
