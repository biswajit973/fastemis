import { Injectable, WritableSignal, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

export interface GhostPersona {
  id: number;
  ghost_member_id?: number;
  ghost_id?: string;
  display_name: string;
  identity_tag?: string;
  info?: string;
  avatar_url: string;
  short_bio: string;
  tone_guidelines: string;
  is_active: boolean;
  sort_order: number;
}

export interface GhostThreadSummary {
  thread_id: string;
  persona: GhostPersona;
  is_persona_locked: boolean;
  is_favorite: boolean;
  unread_for_user: number;
  unread_for_agent: number;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_mobile?: string;
  user_last_login?: string | null;
  user_last_seen_at?: string | null;
  user_is_active_now?: boolean;
  last_message?: {
    id: number | null;
    type: 'text' | 'media' | null;
    preview: string;
    created_at: string | null;
  };
  last_message_at?: string | null;
}

export interface GhostMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  senderName?: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'media';
  mediaUrl?: string;
  mediaName?: string;
  canDelete?: boolean;
  content_masked?: boolean;
  moderation_note?: string;
}

interface GhostThreadListResponse {
  threads?: Array<Record<string, unknown>>;
  safety_rules?: string[];
}

interface GhostMessageListResponse {
  thread_id?: string | number;
  messages?: Array<Record<string, unknown>>;
}

interface GhostMessageCreateResponse {
  message?: Record<string, unknown>;
  content_masked?: boolean;
  moderation_note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GhostChatService {
  readonly threadList = signal<GhostThreadSummary[]>([]);
  readonly safetyRules = signal<string[]>([]);

  private readonly messagesByThread = signal<Record<string, GhostMessage[]>>({});
  private readonly lastMessageIdByThread = new Map<string, number>();
  private readonly unreadByThread = new Map<string, WritableSignal<number>>();

  constructor(private http: HttpClient) {}

  getMessages(threadId: string): GhostMessage[] {
    return this.messagesByThread()[threadId] || [];
  }

  getUnreadSignal(threadId: string): WritableSignal<number> {
    if (!this.unreadByThread.has(threadId)) {
      this.unreadByThread.set(threadId, signal<number>(0));
    }
    return this.unreadByThread.get(threadId)!;
  }

  loadUserThreads(): Observable<GhostThreadSummary[]> {
    return this.http.get<GhostThreadListResponse>('/api/ghost-chats/threads').pipe(
      map((response) => {
        this.safetyRules.set(Array.isArray(response?.safety_rules) ? (response?.safety_rules as string[]) : []);
        return (response?.threads || []).map((raw) => this.mapThread(raw));
      }),
      tap((threads) => {
        this.threadList.set(threads);
        for (const thread of threads) {
          this.getUnreadSignal(thread.thread_id).set(thread.unread_for_user || 0);
        }
      }),
      catchError(() => of(this.threadList()))
    );
  }

  loadAgentThreads(search: string = ''): Observable<GhostThreadSummary[]> {
    let params = new HttpParams();
    const cleanSearch = String(search || '').trim();
    if (cleanSearch) {
      params = params.set('search', cleanSearch);
    }

    return this.http.get<GhostThreadListResponse>('/api/ghost-chats/threads', { params }).pipe(
      map((response) => (response?.threads || []).map((raw) => this.mapThread(raw))),
      tap((threads) => {
        this.threadList.set(threads);
        for (const thread of threads) {
          this.getUnreadSignal(thread.thread_id).set(thread.unread_for_agent || 0);
        }
      }),
      catchError(() => of(this.threadList()))
    );
  }

  createThreadForPersona(personaId: number): Observable<GhostThreadSummary | null> {
    return this.http.post<{ thread?: Record<string, unknown> }>('/api/ghost-chats/threads', {
      persona_id: personaId
    }).pipe(
      map((response) => {
        const raw = response?.thread;
        if (!raw) return null;
        const thread = this.mapThread(raw);
        return thread;
      }),
      tap((thread) => {
        if (!thread) return;
        this.threadList.update((current) => {
          const exists = current.find((item) => item.thread_id === thread.thread_id);
          if (exists) {
            return current.map((item) => item.thread_id === thread.thread_id ? { ...item, ...thread } : item);
          }
          return [thread, ...current];
        });
      }),
      catchError(() => of(null))
    );
  }

  createThreadFromCommunityPost(communityPostId: number): Observable<GhostThreadSummary | null> {
    const postId = Number(communityPostId || 0);
    if (!Number.isFinite(postId) || postId <= 0) {
      return of(null);
    }

    return this.http.post<{ thread?: Record<string, unknown> }>('/api/ghost-chats/threads/from-community', {
      community_post_id: postId
    }).pipe(
      map((response) => {
        const raw = response?.thread;
        if (!raw) return null;
        return this.mapThread(raw);
      }),
      tap((thread) => {
        if (!thread) return;
        this.threadList.update((current) => {
          const exists = current.find((item) => item.thread_id === thread.thread_id);
          if (exists) {
            return current.map((item) => item.thread_id === thread.thread_id ? { ...item, ...thread } : item);
          }
          return [thread, ...current];
        });
      }),
      catchError(() => of(null))
    );
  }

  updateThread(
    threadId: string,
    payload: {
      is_favorite?: boolean;
      is_persona_locked?: boolean;
      persona_id?: number;
      admin_override?: boolean;
    }
  ): Observable<GhostThreadSummary | null> {
    return this.http.patch<{ thread?: Record<string, unknown> }>(`/api/ghost-chats/threads/${threadId}`, payload).pipe(
      map((response) => {
        const raw = response?.thread;
        if (!raw) return null;
        return this.mapThread(raw);
      }),
      tap((thread) => {
        if (!thread) return;
        this.threadList.update((current) => current.map((item) => {
          if (item.thread_id !== thread.thread_id) {
            return item;
          }
          return {
            ...item,
            ...thread,
            persona: thread.persona || item.persona,
            user_name: thread.user_name || item.user_name,
            user_email: thread.user_email || item.user_email,
            user_mobile: thread.user_mobile || item.user_mobile,
            user_last_login: thread.user_last_login || item.user_last_login,
            user_last_seen_at: thread.user_last_seen_at || item.user_last_seen_at,
            user_is_active_now: typeof thread.user_is_active_now === 'boolean' ? thread.user_is_active_now : item.user_is_active_now,
            last_message: thread.last_message || item.last_message,
            last_message_at: thread.last_message_at || item.last_message_at
          };
        }));
      }),
      catchError(() => of(null))
    );
  }

  deleteThread(threadId: string): Observable<boolean> {
    return this.http.delete(`/api/ghost-chats/threads/${threadId}`).pipe(
      map(() => true),
      tap(() => {
        this.threadList.update((current) => current.filter((thread) => thread.thread_id !== threadId));
        this.messagesByThread.update((current) => {
          const next = { ...current };
          delete next[threadId];
          return next;
        });
        this.lastMessageIdByThread.delete(threadId);
      }),
      catchError(() => of(false))
    );
  }

  fetchMessages(threadId: string, options?: { forceFull?: boolean; limit?: number }): Observable<GhostMessage[]> {
    const forceFull = !!options?.forceFull;
    const limit = options?.limit ?? 120;

    let params = new HttpParams()
      .set('thread_id', threadId)
      .set('limit', String(limit));

    const existingLastId = this.lastMessageIdByThread.get(threadId);
    if (!forceFull && existingLastId && existingLastId > 0) {
      params = params.set('since_id', String(existingLastId));
    }

    return this.http.get<GhostMessageListResponse>('/api/ghost-chats/messages', { params }).pipe(
      map((response) => (response?.messages || []).map((raw) => this.normalizeMessage(raw)).filter((item): item is GhostMessage => !!item)),
      tap((incoming) => {
        const incremental = !forceFull && !!existingLastId;
        this.mergeMessages(threadId, incoming, incremental);
      }),
      map(() => this.getMessages(threadId)),
      catchError(() => of(this.getMessages(threadId)))
    );
  }

  sendTextMessage(threadId: string, text: string): Observable<GhostMessage | null> {
    const content = String(text || '').trim();
    if (!content) {
      return of(null);
    }

    return this.http.post<GhostMessageCreateResponse>('/api/ghost-chats/messages', {
      thread_id: threadId,
      content
    }).pipe(
      map((response) => this.normalizeMessage(response?.message || null)),
      tap((message) => {
        if (message) {
          this.mergeMessages(threadId, [message], true);
        }
      }),
      catchError(() => of(null))
    );
  }

  sendMediaMessage(threadId: string, file: File, caption: string = ''): Observable<GhostMessage | null> {
    if (!file) {
      return of(null);
    }

    const formData = new FormData();
    formData.append('thread_id', threadId);
    formData.append('media_file', file);
    formData.append('content', String(caption || '').trim());

    return this.http.post<GhostMessageCreateResponse>('/api/ghost-chats/messages', formData).pipe(
      map((response) => this.normalizeMessage(response?.message || null)),
      tap((message) => {
        if (message) {
          this.mergeMessages(threadId, [message], true);
        }
      }),
      catchError(() => of(null))
    );
  }

  deleteMessageForEveryone(threadId: string, messageId: string): Observable<boolean> {
    const id = Number(messageId);
    if (!Number.isFinite(id) || id <= 0) {
      return of(false);
    }

    return this.http.delete(`/api/ghost-chats/messages/${id}`).pipe(
      map(() => true),
      tap(() => {
        this.messagesByThread.update((current) => ({
          ...current,
          [threadId]: (current[threadId] || []).filter((message) => message.id !== messageId)
        }));
      }),
      catchError(() => of(false))
    );
  }

  getThreadById(threadId: string): GhostThreadSummary | null {
    return this.threadList().find((thread) => thread.thread_id === threadId) || null;
  }

  static hasRestrictedContact(text: string): boolean {
    const source = String(text || '');
    const hasEmail = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(source);
    const hasPhone = /(?<!\d)(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){10,12}(?!\d)/.test(source);
    return hasEmail || hasPhone;
  }

  private mapThread(raw: Record<string, unknown>): GhostThreadSummary {
    const personaRaw = (raw['persona'] || {}) as Record<string, unknown>;
    const persona: GhostPersona = {
      id: Number(personaRaw['id'] || 0),
      ghost_member_id: personaRaw['ghost_member_id'] != null ? Number(personaRaw['ghost_member_id']) : Number(personaRaw['id'] || 0),
      ghost_id: String(personaRaw['ghost_id'] || ''),
      display_name: String(personaRaw['display_name'] || 'Community Member'),
      identity_tag: String(personaRaw['identity_tag'] || ''),
      info: String(personaRaw['info'] || ''),
      avatar_url: String(personaRaw['avatar_url'] || ''),
      short_bio: String(personaRaw['short_bio'] || ''),
      tone_guidelines: String(personaRaw['tone_guidelines'] || ''),
      is_active: Boolean(personaRaw['is_active'] ?? true),
      sort_order: Number(personaRaw['sort_order'] || 100)
    };

    const lastMessageRaw = (raw['last_message'] || {}) as Record<string, unknown>;
    const hasLastMessage = Object.keys(lastMessageRaw).length > 0;

    return {
      thread_id: String(raw['thread_id'] || ''),
      persona,
      is_persona_locked: Boolean(raw['is_persona_locked'] ?? true),
      is_favorite: Boolean(raw['is_favorite'] ?? false),
      unread_for_user: Number(raw['unread_for_user'] || 0),
      unread_for_agent: Number(raw['unread_for_agent'] || 0),
      user_id: raw['user_id'] ? String(raw['user_id']) : undefined,
      user_name: raw['user_name'] ? String(raw['user_name']) : undefined,
      user_email: raw['user_email'] ? String(raw['user_email']) : undefined,
      user_mobile: raw['user_mobile'] ? String(raw['user_mobile']) : undefined,
      user_last_login: raw['user_last_login'] ? String(raw['user_last_login']) : null,
      user_last_seen_at: raw['user_last_seen_at'] ? String(raw['user_last_seen_at']) : null,
      user_is_active_now: typeof raw['user_is_active_now'] === 'boolean' ? Boolean(raw['user_is_active_now']) : false,
      last_message: hasLastMessage
        ? {
            id: lastMessageRaw['id'] != null ? Number(lastMessageRaw['id']) : null,
            type: (lastMessageRaw['type'] ? String(lastMessageRaw['type']) : null) as 'text' | 'media' | null,
            preview: String(lastMessageRaw['preview'] || ''),
            created_at: lastMessageRaw['created_at'] ? String(lastMessageRaw['created_at']) : null
          }
        : undefined,
      last_message_at: raw['last_message_at'] ? String(raw['last_message_at']) : null
    };
  }

  private normalizeMessage(raw: Record<string, unknown> | null): GhostMessage | null {
    if (!raw) {
      return null;
    }

    const idValue = raw['id'];
    const id = Number(idValue);
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }

    const senderRaw = String(raw['sender'] || 'user');
    const sender = (senderRaw === 'agent' || senderRaw === 'system') ? senderRaw : 'user';

    const typeRaw = String(raw['type'] || 'text');
    const type = typeRaw === 'media' ? 'media' : 'text';

    return {
      id: String(id),
      sender,
      senderName: String(raw['senderName'] || ''),
      content: String(raw['content'] || ''),
      timestamp: String(raw['timestamp'] || new Date().toISOString()),
      read: Boolean(raw['read']),
      type,
      mediaUrl: String(raw['mediaUrl'] || ''),
      mediaName: String(raw['mediaName'] || ''),
      canDelete: Boolean(raw['canDelete']),
      content_masked: Boolean(raw['content_masked']),
      moderation_note: String(raw['moderation_note'] || '')
    };
  }

  private mergeMessages(threadId: string, incomingMessages: GhostMessage[], incremental: boolean): void {
    if (!incomingMessages.length) {
      return;
    }

    const currentMessages = this.getMessages(threadId);
    const merged = incremental ? [...currentMessages] : [];
    const indexById = new Map<string, number>();

    for (let i = 0; i < merged.length; i += 1) {
      indexById.set(merged[i].id, i);
    }

    for (const message of incomingMessages) {
      const existingIndex = indexById.get(message.id);
      if (existingIndex === undefined) {
        indexById.set(message.id, merged.length);
        merged.push(message);
      } else {
        merged[existingIndex] = message;
      }
    }

    merged.sort((a, b) => Number(a.id) - Number(b.id));

    this.messagesByThread.update((current) => ({
      ...current,
      [threadId]: merged
    }));

    const lastId = Number(merged[merged.length - 1]?.id || 0);
    if (Number.isFinite(lastId) && lastId > 0) {
      this.lastMessageIdByThread.set(threadId, lastId);
    }
  }
}
