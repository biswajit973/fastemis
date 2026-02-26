import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GhostChatService, GhostMessage, GhostThreadSummary } from '../../core/services/ghost-chat.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  styles: [`
    .chat-font {
      font-family: 'Google Sans', 'Segoe UI', sans-serif;
    }
  `],
  template: `
    <div class="flex flex-col h-screen chat-font bg-surface-2">
      <header class="border-b border-border h-16 flex items-center justify-between px-4 shrink-0 sticky top-0 z-20 gap-3 bg-surface/85 backdrop-blur-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div class="flex items-center gap-3 min-w-0">
          <a routerLink="/dashboard" class="text-secondary hover:text-primary transition-standard shrink-0" aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </a>
          <div class="min-w-0">
            <h2 class="font-extrabold text-primary leading-tight truncate">Private Chats</h2>
            <p class="text-xs font-medium text-secondary truncate">Threaded by community members. Same identity stays in same thread.</p>
          </div>
        </div>
        <button type="button" (click)="toggleThreadList()" class="md:hidden px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-primary shadow-sm hover:border-primary transition-colors">
          {{ showThreadListMobile() ? 'Open Chat' : 'Threads' }}
        </button>
      </header>

      <main class="flex-1 min-h-0 md:grid md:grid-cols-[320px_1fr]">
        <aside
          class="border-r border-border bg-white overflow-y-auto"
          [ngClass]="showThreadListMobile() ? 'block' : 'hidden md:block'">
          <div class="p-3 border-b border-border sticky top-0 bg-white z-10">
            <p class="text-[11px] text-secondary mb-1">Safety Rules</p>
            <p class="text-[11px] text-muted" *ngFor="let rule of safetyRules()">• {{ rule }}</p>
          </div>

          <div *ngIf="loadingThreads()" class="p-4 text-center text-secondary text-sm">Loading chats...</div>
          <button
            *ngFor="let thread of threads(); trackBy: trackByThread"
            type="button"
            (click)="selectThread(thread.thread_id)"
            class="w-full text-left px-3 py-3 border-b border-border/60 hover:bg-surface-2 transition-colors"
            [ngClass]="thread.thread_id === activeThreadId() ? 'bg-primary/5' : ''">
            <div class="flex items-center justify-between gap-2 mb-1">
              <p class="text-sm font-semibold text-primary truncate">{{ thread.persona.display_name }}</p>
              <span *ngIf="thread.unread_for_user > 0" class="px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-bold">{{ thread.unread_for_user }}</span>
            </div>
            <p class="text-[11px] text-secondary truncate">{{ thread.persona.info || thread.persona.short_bio || 'Community member' }}</p>
            <p class="text-[11px] text-muted truncate mt-1">{{ thread.last_message?.preview || 'No messages yet' }}</p>
          </button>

          <div *ngIf="!loadingThreads() && threads().length === 0" class="p-5 text-center text-secondary text-sm">
            No private chats yet. Open one from Community.
          </div>
        </aside>

        <section class="flex flex-col min-h-0" [ngClass]="showThreadListMobile() ? 'hidden md:flex' : 'flex'">
          <div class="px-4 py-3 border-b border-border bg-white flex items-center justify-between gap-3" *ngIf="activeThread() as currentThread">
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-primary truncate">{{ currentThread.persona.display_name }}</h3>
              <p class="text-[11px] text-secondary truncate">{{ currentThread.persona.info || currentThread.persona.short_bio || 'Community member' }}</p>
              <p class="text-[11px] text-muted" *ngIf="currentThread.is_persona_locked">Persona locked for this thread</p>
            </div>
            <button type="button" (click)="showMediaGallery.set(!showMediaGallery())" class="px-2.5 py-1 rounded border border-border text-xs text-primary">
              Media ({{ sharedMedia().length }})
            </button>
          </div>

          <div *ngIf="!activeThread()" class="flex-1 flex items-center justify-center text-secondary text-sm px-4 text-center">
            Select a private chat from the list.
          </div>

          <div *ngIf="activeThread()" class="flex-1 min-h-0 relative">
            <div *ngIf="!showMediaGallery()" class="h-full overflow-y-auto p-4 space-y-3" #scrollContainer>
              <div *ngFor="let msg of messagesState()" class="flex flex-col max-w-[85%]"
                [ngClass]="{
                  'self-end items-end': msg.sender === 'user',
                  'self-start items-start': msg.sender === 'agent' || msg.sender === 'system',
                  'mx-auto text-center !max-w-full': msg.sender === 'system'
                }">

                <ng-container *ngIf="msg.sender !== 'system'">
                  <div class="text-[10px] text-muted mb-1" *ngIf="msg.sender === 'agent'">{{ msg.senderName || activeThread()?.persona?.display_name }}</div>
                  <div class="p-3 rounded-2xl shadow-sm text-sm border"
                    [ngClass]="msg.sender === 'user' ? 'bg-[#d9fdd3] text-[#111b21] border-[#bfe7b7] rounded-tr-sm' : 'bg-white border-border text-primary rounded-tl-sm'">
                    <span *ngIf="msg.type === 'text'" class="whitespace-pre-wrap">{{ msg.content }}</span>
                    <div *ngIf="msg.type === 'media'" class="space-y-2">
                      <img *ngIf="msg.mediaUrl && isImage(msg.mediaName)" [src]="msg.mediaUrl" class="rounded max-h-56 object-cover">
                      <video *ngIf="msg.mediaUrl && isVideo(msg.mediaName)" [src]="msg.mediaUrl" controls class="rounded max-h-56 bg-black"></video>
                      <div *ngIf="!msg.mediaUrl || (!isImage(msg.mediaName) && !isVideo(msg.mediaName))" class="text-xs bg-black/10 rounded px-2 py-1">
                        {{ msg.mediaName || 'Attachment' }}
                      </div>
                      <button type="button" (click)="openMediaPreview(msg)" class="inline-flex items-center gap-1 rounded-full border border-current/30 px-2 py-1 text-[10px]">
                        Preview
                      </button>
                    </div>
                  </div>
                  <p class="text-[10px] text-muted mt-1">{{ formatDateTime(msg.timestamp) }}</p>
                </ng-container>

                <ng-container *ngIf="msg.sender === 'system'">
                  <div class="bg-surface-3 border border-border text-secondary text-xs px-3 py-2 rounded-lg">{{ msg.content }}</div>
                </ng-container>
              </div>
            </div>

            <div *ngIf="showMediaGallery()" class="h-full overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
              <div *ngIf="sharedMedia().length === 0" class="col-span-full py-10 text-center text-secondary text-sm">No shared media yet.</div>
              <article *ngFor="let media of sharedMedia()" class="border border-border rounded-xl overflow-hidden bg-surface-2">
                <img *ngIf="media.mediaUrl && isImage(media.mediaName)" [src]="media.mediaUrl" class="w-full h-40 object-cover">
                <video *ngIf="media.mediaUrl && isVideo(media.mediaName)" [src]="media.mediaUrl" class="w-full h-40 object-cover bg-black" controls></video>
                <div *ngIf="!media.mediaUrl || (!isImage(media.mediaName) && !isVideo(media.mediaName))" class="h-40 flex items-center justify-center text-secondary text-xs">{{ media.mediaName || 'Attachment' }}</div>
                <div class="px-3 py-2 border-t border-border">
                  <p class="text-[11px] text-primary truncate">{{ media.mediaName || 'Attachment' }}</p>
                  <p class="text-[10px] text-secondary">{{ formatDateTime(media.timestamp) }}</p>
                </div>
              </article>
            </div>
          </div>

          <footer *ngIf="activeThread()" class="bg-white/95 border-t border-border p-3 flex items-center gap-2 shrink-0">
            <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept="image/*,video/*,.pdf,.txt">
            <button type="button" (click)="fileInput.click()" class="w-10 h-10 rounded-full text-secondary hover:bg-surface-3 flex items-center justify-center shrink-0" title="Share media">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            </button>

            <div class="flex-1 bg-surface-2 rounded-full border border-border px-4 py-2">
              <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type your message..." class="w-full bg-transparent border-none outline-none text-sm text-primary placeholder-muted" />
            </div>

            <button type="button" (click)="sendMessage()" [disabled]="!newMessage.trim() || restrictedMessage()" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              [ngClass]="newMessage.trim() && !restrictedMessage() ? 'bg-[#ff8f00] text-white' : 'bg-surface-3 text-muted'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </footer>

          <div *ngIf="restrictedMessage()" class="px-4 pb-3 text-[11px] text-error bg-surface">
            Personal phone numbers/emails are not allowed in private chats.
          </div>
        </section>
      </main>
    </div>

    <div *ngIf="previewMedia()" class="fixed inset-0 z-[96] bg-black/85 p-4 flex flex-col">
      <div class="flex items-center justify-between text-white mb-3">
        <div>
          <p class="text-sm font-medium">{{ previewMedia()?.mediaName || 'Attachment' }}</p>
          <p class="text-xs text-white/70">{{ formatDateTime(previewMedia()?.timestamp || '') }}</p>
        </div>
        <button type="button" (click)="closeMediaPreview()" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">X</button>
      </div>
      <div class="flex-1 rounded-xl border border-white/20 bg-black/30 p-2 flex items-center justify-center overflow-hidden">
        <img *ngIf="previewMedia()?.mediaUrl && isImage(previewMedia()?.mediaName)" [src]="previewMedia()?.mediaUrl || ''" class="max-h-full max-w-full object-contain rounded" alt="preview" />
        <video *ngIf="previewMedia()?.mediaUrl && isVideo(previewMedia()?.mediaName)" [src]="previewMedia()?.mediaUrl || ''" controls autoplay class="max-h-full max-w-full rounded"></video>
      </div>
    </div>
  `
})
export class MessagesComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  threads = signal<GhostThreadSummary[]>([]);
  messagesState = signal<GhostMessage[]>([]);
  activeThreadId = signal<string>('');
  showThreadListMobile = signal<boolean>(true);
  showMediaGallery = signal<boolean>(false);
  loadingThreads = signal<boolean>(false);
  previewMedia = signal<GhostMessage | null>(null);

  newMessage = '';

  private threadsPoller: number | null = null;
  private messagesPoller: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private ghostChatService: GhostChatService
  ) { }

  ngOnInit(): void {
    this.loadThreads(true);

    this.route.queryParamMap.subscribe((params) => {
      const threadId = String(params.get('thread') || '').trim();
      if (threadId) {
        this.selectThread(threadId);
      }
    });

    this.threadsPoller = window.setInterval(() => this.loadThreads(false), 9000);
    this.messagesPoller = window.setInterval(() => this.refreshMessages(true), 6000);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.threadsPoller !== null) {
      window.clearInterval(this.threadsPoller);
      this.threadsPoller = null;
    }
    if (this.messagesPoller !== null) {
      window.clearInterval(this.messagesPoller);
      this.messagesPoller = null;
    }
  }

  activeThread(): GhostThreadSummary | null {
    return this.threads().find((item) => item.thread_id === this.activeThreadId()) || null;
  }

  safetyRules(): string[] {
    return this.ghostChatService.safetyRules();
  }

  toggleThreadList(): void {
    this.showThreadListMobile.update((value) => !value);
  }

  selectThread(threadId: string): void {
    if (!threadId) {
      return;
    }

    this.activeThreadId.set(threadId);
    this.showThreadListMobile.set(false);
    this.showMediaGallery.set(false);
    this.refreshMessages(false);
  }

  restrictedMessage(): boolean {
    return GhostChatService.hasRestrictedContact(this.newMessage);
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    const threadId = this.activeThreadId();
    if (!text || !threadId || this.restrictedMessage()) {
      return;
    }

    this.newMessage = '';
    this.ghostChatService.sendTextMessage(threadId, text).subscribe(() => {
      this.refreshMessages(true);
      this.loadThreads(false);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const threadId = this.activeThreadId();
    if (!file || !threadId) {
      return;
    }

    this.ghostChatService.sendMediaMessage(threadId, file).subscribe(() => {
      this.refreshMessages(true);
      this.loadThreads(false);
      input.value = '';
    });
  }

  sharedMedia(): GhostMessage[] {
    return this.messagesState().filter((message) => message.type === 'media');
  }

  openMediaPreview(message: GhostMessage): void {
    this.previewMedia.set(message);
  }

  closeMediaPreview(): void {
    this.previewMedia.set(null);
  }

  isImage(name?: string): boolean {
    return !!name && /(png|jpg|jpeg|gif|webp)$/i.test(name);
  }

  isVideo(name?: string): boolean {
    return !!name && /(mp4|webm|ogg|mov)$/i.test(name);
  }

  formatDateTime(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return '-';
    }
    return date.toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByThread(_index: number, thread: GhostThreadSummary): string {
    return thread.thread_id;
  }

  private loadThreads(forceSelectFirst: boolean): void {
    this.loadingThreads.set(true);
    this.ghostChatService.loadUserThreads().subscribe((threads) => {
      this.loadingThreads.set(false);
      this.threads.set(threads);

      const activeId = this.activeThreadId();
      const activeExists = !!threads.find((thread) => thread.thread_id === activeId);

      if (!activeExists) {
        const first = threads[0];
        if (first) {
          this.activeThreadId.set(first.thread_id);
          this.showThreadListMobile.set(false);
          this.refreshMessages(false);
          return;
        }
      }

      if (forceSelectFirst && !activeId && threads.length > 0) {
        this.activeThreadId.set(threads[0].thread_id);
        this.showThreadListMobile.set(false);
        this.refreshMessages(false);
      }
    });
  }

  private refreshMessages(incremental: boolean): void {
    const threadId = this.activeThreadId();
    if (!threadId) {
      return;
    }

    this.ghostChatService.fetchMessages(threadId, { forceFull: !incremental }).subscribe((messages) => {
      this.messagesState.set(messages);
      const thread = this.activeThread();
      if (thread) {
        thread.unread_for_user = messages.filter((message) => message.sender === 'agent' && !message.read).length;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer && !this.showMediaGallery()) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // no-op
    }
  }
}
