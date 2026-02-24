import { Injectable, signal } from '@angular/core';

export interface CommunityMessage {
    id: string;
    senderRole: 'user' | 'agent';
    username: string; // The display name of the poster
    content: string;
    timestamp: string;
    type: 'text' | 'media';
    mediaUrl?: string;
    mediaName?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CommunityService {
    public messages = signal<CommunityMessage[]>([]);

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        const saved = localStorage.getItem('mock_community_state');
        if (saved) {
            this.messages.set(JSON.parse(saved));
        } else {
            // Initial mock state to make it look active
            this.messages.set([
                { id: 'c1', senderRole: 'agent', username: 'CryptoGuru99', content: 'Has anyone gotten their BGV cleared today?', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'text' },
                { id: 'c2', senderRole: 'agent', username: 'LoanMaster', content: 'Yes, mine cleared just an hour ago! Going to do the agreement now.', timestamp: new Date(Date.now() - 3500000).toISOString(), type: 'text' },
                { id: 'c3', senderRole: 'agent', username: 'FinanceWhiz', content: 'How long did the KYC review take you guys?', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: 'text' },
                { id: 'c4', senderRole: 'agent', username: 'CryptoGuru99', content: 'About 2 hours. Just make sure your PAN matches the photo exactly.', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), type: 'text' },
                { id: 'c5', senderRole: 'agent', username: 'AdminBot', content: 'Welcome to the FastEMIs Community! Please be respectful.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'text' }
            ]);
            this.saveToStorage();
        }
    }

    private saveToStorage() {
        localStorage.setItem('mock_community_state', JSON.stringify(this.messages()));
    }

    sendMessage(msg: Omit<CommunityMessage, 'id' | 'timestamp'>) {
        const newMsg: CommunityMessage = {
            ...msg,
            id: 'CM-' + Date.now().toString(),
            timestamp: new Date().toISOString()
        };
        this.messages.update(m => [...m, newMsg]);
        this.saveToStorage();
    }
}
