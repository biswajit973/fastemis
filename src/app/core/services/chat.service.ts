import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'agent' | 'system';
    senderName?: string;
    content: string;
    timestamp: string;
    read: boolean;
    type: 'text' | 'media';
    mediaUrl?: string;
    mediaName?: string;
}

interface ChatThreads {
    [userId: string]: ChatMessage[];
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private readonly threadsStorageKey = 'mock_chat_threads_v1';
    private readonly aliasesStorageKey = 'mock_chat_aliases_v1';
    private readonly defaultUserId = 'USR-MOCK-123';

    private threads: ChatThreads = {};
    private agentAliases: Record<string, string> = {};

    constructor(private authService: AuthService) {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        const savedThreads = localStorage.getItem(this.threadsStorageKey);
        const savedAliases = localStorage.getItem(this.aliasesStorageKey);

        if (savedThreads) {
            try {
                this.threads = JSON.parse(savedThreads);
            } catch (e) {
                this.threads = {};
            }
        }

        if (savedAliases) {
            try {
                this.agentAliases = JSON.parse(savedAliases);
            } catch (e) {
                this.agentAliases = {};
            }
        }

        if (Object.keys(this.threads).length === 0) {
            this.threads = this.defaultThreads();
            this.saveToStorage();
        }
    }

    private saveToStorage() {
        localStorage.setItem(this.threadsStorageKey, JSON.stringify(this.threads));
        localStorage.setItem(this.aliasesStorageKey, JSON.stringify(this.agentAliases));
    }

    private ensureThread(userId: string) {
        if (!this.threads[userId]) {
            this.threads[userId] = [];
            this.saveToStorage();
        }
    }

    getMessages(userId: string = this.defaultUserId): ChatMessage[] {
        this.ensureThread(userId);
        return [...this.threads[userId]];
    }

    sendMessage(userId: string, msg: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): void;
    sendMessage(msg: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): void;
    sendMessage(
        userOrMsg: string | Omit<ChatMessage, 'id' | 'timestamp' | 'read'>,
        maybeMsg?: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>
    ) {
        const userId = typeof userOrMsg === 'string' ? userOrMsg : this.defaultUserId;
        const msg = typeof userOrMsg === 'string' ? maybeMsg : userOrMsg;

        if (!msg) {
            return;
        }

        this.ensureThread(userId);

        const next: ChatMessage = {
            ...msg,
            id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            read: msg.sender !== 'user'
        };

        this.threads[userId] = [...this.threads[userId], next];
        this.saveToStorage();
    }

    markAllAsRead(userId: string = this.defaultUserId) {
        this.ensureThread(userId);
        this.threads[userId] = this.threads[userId].map(m => ({ ...m, read: true }));
        this.saveToStorage();
    }

    deleteMessageForEveryone(userId: string, messageId: string): void;
    deleteMessageForEveryone(messageId: string): void;
    deleteMessageForEveryone(userOrMessageId: string, maybeMessageId?: string) {
        const userId = maybeMessageId ? userOrMessageId : this.defaultUserId;
        const messageId = maybeMessageId || userOrMessageId;

        this.ensureThread(userId);
        this.threads[userId] = this.threads[userId].filter(m => m.id !== messageId);
        this.saveToStorage();
    }

    getSharedMedia(userId: string = this.defaultUserId): ChatMessage[] {
        this.ensureThread(userId);
        return this.threads[userId].filter(m => m.type === 'media');
    }

    clearConversation(userId: string) {
        delete this.threads[userId];
        delete this.agentAliases[userId];
        localStorage.removeItem(`assigned_agent_name_${userId}`);
        this.saveToStorage();
    }

    setAgentAlias(userId: string, alias: string) {
        this.agentAliases[userId] = alias;
        localStorage.setItem(`assigned_agent_name_${userId}`, alias);

        const user = this.authService.currentUserSignal();
        if (user?.id === userId) {
            this.authService.setUser({ ...user, assignedAgentName: alias });
        }

        this.saveToStorage();
    }

    getAgentAlias(userId: string): string {
        return this.agentAliases[userId] || localStorage.getItem(`assigned_agent_name_${userId}`) || 'FastEMIs Agent';
    }

    private defaultThreads(): ChatThreads {
        const now = Date.now();

        return {
            'USR-MOCK-123': [
                {
                    id: '1',
                    sender: 'agent',
                    senderName: 'FastEMIs Agent',
                    content: 'Hi Samantha, your profile is under BGV review.',
                    timestamp: new Date(now - 1000 * 60 * 60).toISOString(),
                    read: true,
                    type: 'text'
                },
                {
                    id: '2',
                    sender: 'user',
                    content: 'Do you need any additional document for BGV?',
                    timestamp: new Date(now - 1000 * 60 * 35).toISOString(),
                    read: true,
                    type: 'text'
                },
                {
                    id: '3',
                    sender: 'user',
                    content: 'Uploaded my latest salary slip.',
                    timestamp: new Date(now - 1000 * 60 * 32).toISOString(),
                    read: true,
                    type: 'media',
                    mediaName: 'salary-slip.jpg',
                    mediaUrl: 'https://picsum.photos/seed/chat-slip/360/260'
                }
            ],
            'USR-MOCK-456': [
                {
                    id: '4',
                    sender: 'agent',
                    senderName: 'FastEMIs Agent',
                    content: 'Hi David, your KYC fee has been received.',
                    timestamp: new Date(now - 1000 * 60 * 90).toISOString(),
                    read: true,
                    type: 'text'
                },
                {
                    id: '5',
                    sender: 'user',
                    content: 'Thanks, when will agreement be available?',
                    timestamp: new Date(now - 1000 * 60 * 82).toISOString(),
                    read: true,
                    type: 'text'
                }
            ],
            'USR-MOCK-789': [
                {
                    id: '6',
                    sender: 'agent',
                    senderName: 'FastEMIs Agent',
                    content: 'Congratulations Maria, your BGV is approved.',
                    timestamp: new Date(now - 1000 * 60 * 20).toISOString(),
                    read: true,
                    type: 'text'
                }
            ],
            'USR-MOCK-101': [
                {
                    id: '7',
                    sender: 'system',
                    content: 'This chat was closed after BGV rejection.',
                    timestamp: new Date(now - 1000 * 60 * 240).toISOString(),
                    read: true,
                    type: 'text'
                }
            ]
        };
    }
}
