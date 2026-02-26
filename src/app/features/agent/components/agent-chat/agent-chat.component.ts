import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage, ChatService, ChatThreadSummary } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-agent-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative"
      [ngClass]="fullscreen() ? 'fixed inset-0 z-[80] bg-surface p-0' : ''">
      <div class="bg-surface border border-border rounded-xl shadow-sm flex flex-col overflow-hidden relative"
        [ngClass]="containerClass()">

        <div *ngIf="showAliasPopup()" class="absolute inset-0 z-20 bg-surface/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div class="bg-surface border border-border rounded-xl p-6 shadow-xl max-w-sm w-full">
            <h3 class="text-lg font-bold text-primary mb-2">Set Chat Name</h3>
            <p class="text-sm text-secondary mb-4">Enter the display name for this user conversation.</p>
            <input
              type="text"
              [(ngModel)]="customAgentName"
              placeholder="e.g. Verification Desk"
              class="w-full text-sm rounded bg-surface border border-border px-4 py-2 mb-4 focus:outline-none focus:border-primary">
            <button
              type="button"
              (click)="connectToChat()"
              [disabled]="!customAgentName.trim()"
              class="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50">
              Continue
            </button>
          </div>
        </div>

        <div class="bg-surface-2 px-4 py-3 border-b border-border flex justify-between items-start shrink-0 gap-2">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">{{ initials(userName) }}</div>
            <div class="min-w-0">
              <h2 class="font-bold text-primary text-sm leading-tight truncate">{{ userName || 'Unknown User' }}</h2>
              <p class="text-[11px] text-secondary truncate">Last login: {{ formatDateTime(lastLoginAt) }}</p>
              <p class="text-[11px] truncate" [ngClass]="threadState()?.isActiveNow ? 'text-success' : 'text-muted'">
                {{ threadState()?.isActiveNow ? 'Active now' : 'Offline' }}
              </p>
              <p class="text-[10px] text-muted truncate">Chat as: {{ activeAgentName() }}</p>
            </div>
          </div>

          <div class="flex gap-2 shrink-0">
            <button type="button" (click)="showAliasPopup.set(true)" class="px-2.5 py-1 text-xs border border-border rounded bg-surface hover:bg-surface-3 text-secondary">Rename</button>
            <button type="button" (click)="showMediaGallery.set(!showMediaGallery())" class="px-2.5 py-1 text-xs border border-border rounded bg-surface hover:bg-surface-3 text-secondary">
              Media ({{ sharedMedia().length }})
            </button>
            <button type="button" (click)="toggleFullscreen()" class="px-2.5 py-1 text-xs border border-border rounded bg-surface hover:bg-surface-3 text-secondary">
              {{ fullscreen() ? 'Exit Full' : 'Full Screen' }}
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden relative">
          <div class="flex-1 overflow-y-auto p-4 space-y-4 h-full" [class.hidden]="showMediaGallery()" #scrollContainer>
            <div class="text-center mb-6">
              <span class="bg-surface-2 px-3 py-1 rounded-full text-[10px] font-medium text-secondary border border-border">
                Agent can delete messages/media for everyone silently
              </span>
            </div>

            <div *ngFor="let msg of messagesState()" class="flex flex-col max-w-[85%] relative group"
              [ngClass]="{
                'self-start items-start': msg.sender === 'user',
                'self-end items-end': msg.sender === 'agent' || msg.sender === 'system',
                'mx-auto text-center !max-w-full': msg.sender === 'system'
              }">
              <ng-container *ngIf="msg.sender !== 'system'">
                <div *ngIf="msg.sender === 'agent'" class="text-[10px] text-muted mb-1 mx-1">{{ msg.senderName || activeAgentName() }}</div>
                <div class="relative p-3 rounded-2xl shadow-sm text-sm border"
                  [ngClass]="{
                    'bg-surface text-primary rounded-tl-sm border-border': msg.sender === 'user',
                    'bg-primary text-white rounded-tr-sm border-primary/60': msg.sender === 'agent',
                    '!border-error ring-2 ring-error/25': deleteTargetId() === msg.id
                  }">
                  <button
                    *ngIf="msg.canDelete"
                    type="button"
                    (click)="requestDeleteMessage(msg.id)"
                    class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-error text-white flex items-center justify-center shadow-sm hover:opacity-90 z-10 border-2 border-surface"
                    title="Delete for everyone">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  <span *ngIf="msg.type === 'text'" class="chat-handwriting">{{ msg.content }}</span>
                  <div *ngIf="msg.type === 'media'" class="space-y-2">
                    <img *ngIf="msg.mediaUrl && isImage(msg.mediaName)" [src]="msg.mediaUrl" loading="lazy" class="rounded max-h-48 object-cover">
                    <video *ngIf="msg.mediaUrl && isVideo(msg.mediaName)" [src]="msg.mediaUrl" controls class="rounded max-h-52 bg-black"></video>
                    <div *ngIf="!msg.mediaUrl || (!isImage(msg.mediaName) && !isVideo(msg.mediaName))" class="text-xs flex items-center gap-2 bg-black/10 rounded px-2 py-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      <span>{{ msg.mediaName || 'Attachment' }}</span>
                    </div>
                    <button
                      type="button"
                      (click)="openMediaPreview(msg)"
                      class="inline-flex items-center gap-1 rounded-full border border-current/30 px-2 py-1 text-[10px]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      Preview
                    </button>
                  </div>
                </div>
                <div class="text-[10px] text-muted mt-1 mx-1">{{ formatDateTime(msg.timestamp) }}</div>
              </ng-container>

              <ng-container *ngIf="msg.sender === 'system'">
                <div class="bg-surface-3 border border-border text-secondary text-xs px-4 py-2 rounded-lg my-2 mx-auto">{{ msg.content }}</div>
              </ng-container>
            </div>
          </div>

          <div *ngIf="showMediaGallery()" class="absolute inset-0 bg-surface z-10 flex flex-col">
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
              <div *ngIf="sharedMedia().length === 0" class="col-span-full py-12 text-center text-secondary text-sm">No shared media in this chat.</div>
              <div *ngFor="let media of sharedMedia()" class="relative">
                <article
                  class="border rounded-xl bg-surface-2 shadow-sm overflow-hidden"
                  [ngClass]="deleteTargetId() === media.id ? 'border-error ring-2 ring-error/20' : 'border-border'">
                  <div class="relative">
                    <img *ngIf="media.mediaUrl && isImage(media.mediaName)" [src]="media.mediaUrl" loading="lazy" class="w-full h-40 object-cover">
                    <video *ngIf="media.mediaUrl && isVideo(media.mediaName)" [src]="media.mediaUrl" class="w-full h-40 object-cover bg-black" controls></video>
                    <div *ngIf="!media.mediaUrl || (!isImage(media.mediaName) && !isVideo(media.mediaName))" class="h-40 bg-surface-3 flex items-center justify-center text-secondary">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <button
                      type="button"
                      (click)="openMediaPreview(media)"
                      class="absolute left-2 bottom-2 bg-black/65 text-white px-2 py-1 rounded-full text-[11px] flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      Preview
                    </button>
                  </div>
                  <div class="px-3 py-2 border-t border-border">
                    <p class="text-[11px] text-primary truncate">{{ media.mediaName || 'Attachment' }}</p>
                    <p class="text-[10px] text-secondary">Shared {{ formatDateTime(media.timestamp) }}</p>
                  </div>
                </article>
                <button
                  type="button"
                  *ngIf="media.canDelete"
                  (click)="requestDeleteMessage(media.id)"
                  class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-error text-white w-7 h-7 rounded-full flex items-center justify-center shadow-sm hover:opacity-90 z-10 border-2 border-surface"
                  title="Delete for everyone">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-surface border-t border-border p-3 flex items-center gap-2 shrink-0">
          <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept="image/*,video/*,.pdf,.doc,.docx,.txt">
          <button type="button" (click)="fileInput.click()" class="w-10 h-10 rounded-full text-secondary hover:bg-surface-3 flex items-center justify-center shrink-0" title="Share Media">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
          </button>
          <div class="flex-1 bg-surface-2 rounded-full border border-border px-4 py-2 flex items-center">
            <input
              type="text"
              [(ngModel)]="newMessage"
              (keyup.enter)="sendMessage()"
              [placeholder]="'Message as ' + activeAgentName()"
              class="w-full bg-transparent border-none outline-none text-sm text-primary placeholder-muted" />
          </div>
          <button
            type="button"
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            [ngClass]="newMessage.trim() ? 'bg-primary text-white shadow-md' : 'bg-surface-3 text-muted'"
            [disabled]="!newMessage.trim()"
            (click)="sendMessage()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="deleteTargetId()" class="fixed inset-0 z-[95] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div class="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl p-5">
        <h3 class="text-lg font-semibold text-primary mb-1">Delete Message</h3>
        <p class="text-sm text-secondary mb-4">Are you sure you want to delete?</p>
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            (click)="cancelDelete()"
            class="px-3 py-2 rounded-lg border border-border text-secondary hover:text-primary">
            Cancel
          </button>
          <button
            type="button"
            (click)="confirmDelete()"
            [disabled]="deleteBusy()"
            class="px-3 py-2 rounded-lg bg-error text-white hover:bg-error/90 disabled:opacity-60">
            {{ deleteBusy() ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="previewMedia()" class="fixed inset-0 z-[96] bg-black/85 backdrop-blur-[1px] p-4 flex flex-col">
      <div class="flex items-center justify-between text-white mb-3">
        <div class="min-w-0">
          <p class="text-sm font-medium truncate">{{ previewMedia()?.mediaName || 'Attachment' }}</p>
          <p class="text-xs text-white/70">Shared {{ formatDateTime(previewMedia()?.timestamp) }}</p>
        </div>
        <button
          type="button"
          (click)="closeMediaPreview()"
          class="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="flex-1 min-h-0 rounded-2xl border border-white/20 bg-black/30 p-2 flex items-center justify-center overflow-hidden">
        <img
          *ngIf="previewMedia()?.mediaUrl && isImage(previewMedia()?.mediaName)"
          [src]="previewMedia()?.mediaUrl || ''"
          class="max-h-full max-w-full object-contain rounded-xl"
          alt="Media preview">
        <video
          *ngIf="previewMedia()?.mediaUrl && isVideo(previewMedia()?.mediaName)"
          [src]="previewMedia()?.mediaUrl || ''"
          controls
          autoplay
          class="max-h-full max-w-full rounded-xl bg-black"></video>
        <iframe
          *ngIf="previewMedia()?.mediaUrl && isEmbeddableFile(previewMedia()?.mediaName)"
          [src]="previewMedia()?.mediaUrl || ''"
          class="w-full h-full rounded-xl bg-white"
          title="File preview"></iframe>
        <div
          *ngIf="!previewMedia()?.mediaUrl || (!isImage(previewMedia()?.mediaName) && !isVideo(previewMedia()?.mediaName) && !isEmbeddableFile(previewMedia()?.mediaName))"
          class="text-center text-white/80 px-4">
          <p class="text-sm mb-3">Preview is not available for this file type.</p>
          <a
            *ngIf="previewMedia()?.mediaUrl"
            [href]="previewMedia()?.mediaUrl || ''"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center rounded-full bg-white text-primary px-4 py-2 text-sm font-medium no-underline">
            Open File
          </a>
        </div>
      </div>
    </div>
  `
  ,
  styles: [`
    .chat-handwriting {
      font-family: "Google Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0.01em;
      line-height: 1.45;
    }
  `]
})
export class AgentChatComponent implements OnChanges, AfterViewChecked, OnDestroy {
  @Input() userId: string = '';
  @Input() userName: string = '';
  @Input() lastLoginAt: string = '';
  @Input() fullPage: boolean = false;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  customAgentName: string = '';
  newMessage: string = '';

  showMediaGallery = signal<boolean>(false);
  showAliasPopup = signal<boolean>(false);
  fullscreen = signal<boolean>(false);
  deleteTargetId = signal<string>('');
  deleteBusy = signal<boolean>(false);
  previewMedia = signal<ChatMessage | null>(null);

  messagesState = signal<ChatMessage[]>([]);
  threadState = signal<ChatThreadSummary | null>(null);

  private messagesPoller: number | null = null;
  private threadPoller: number | null = null;

  constructor(private chatService: ChatService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      this.setupChatSession();
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  containerClass(): string {
    if (this.fullscreen()) {
      return 'h-screen rounded-none border-0';
    }
    return this.fullPage ? 'h-[calc(100vh-13rem)] md:h-[calc(100vh-12rem)]' : 'h-[680px]';
  }

  toggleFullscreen(): void {
    this.fullscreen.update(value => !value);
  }

  activeAgentName(): string {
    return this.chatService.getAgentAlias(this.userId);
  }

  connectToChat(): void {
    const alias = this.customAgentName.trim();
    if (!this.userId || !alias) {
      return;
    }

    this.chatService.setAgentAlias(this.userId, alias).subscribe((ok) => {
      if (ok) {
        this.showAliasPopup.set(false);
      }
    });
  }

  sendMessage(): void {
    if (!this.userId || !this.newMessage.trim()) {
      return;
    }

    const text = this.newMessage.trim();
    this.newMessage = '';

    this.chatService.sendTextMessage(this.userId, text).subscribe(() => {
      this.refreshMessages(true);
      this.refreshThreads();
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.userId) {
      return;
    }

    this.chatService.sendMediaMessage(this.userId, file).subscribe(() => {
      this.refreshMessages(true);
      this.refreshThreads();
      input.value = '';
    });
  }

  requestDeleteMessage(messageId: string): void {
    this.deleteTargetId.set(messageId);
  }

  cancelDelete(): void {
    this.deleteTargetId.set('');
    this.deleteBusy.set(false);
  }

  confirmDelete(): void {
    const messageId = this.deleteTargetId();
    if (!messageId) {
      return;
    }
    this.deleteBusy.set(true);
    this.chatService.deleteMessageForEveryone(this.userId, messageId).subscribe((ok) => {
      this.deleteBusy.set(false);
      if (ok) {
        this.messagesState.set(this.chatService.getMessages(this.userId));
      }
      this.deleteTargetId.set('');
    });
  }

  openMediaPreview(message: ChatMessage): void {
    this.previewMedia.set(message);
  }

  closeMediaPreview(): void {
    this.previewMedia.set(null);
  }

  sharedMedia(): ChatMessage[] {
    return this.messagesState().filter(message => message.type === 'media');
  }

  formatDateTime(value?: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  initials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
  }

  isImage(name?: string): boolean {
    return !!name && /(png|jpg|jpeg|gif|webp)$/i.test(name);
  }

  isVideo(name?: string): boolean {
    return !!name && /(mp4|webm|ogg|mov)$/i.test(name);
  }

  isEmbeddableFile(name?: string): boolean {
    return !!name && /(pdf|txt)$/i.test(name);
  }

  private setupChatSession(): void {
    if (!this.userId) {
      return;
    }

    this.stopPolling();
    this.messagesState.set([]);

    const alias = this.chatService.getAgentAlias(this.userId);
    this.customAgentName = alias === 'Support Executive' ? '' : alias;
    this.showAliasPopup.set(!this.customAgentName.trim());

    this.refreshMessages(false);
    this.refreshThreads();

    this.messagesPoller = window.setInterval(() => this.refreshMessages(true), 6000);
    this.threadPoller = window.setInterval(() => this.refreshThreads(), 8000);
  }

  private refreshMessages(incremental: boolean): void {
    this.chatService.fetchMessages(this.userId, { forceFull: !incremental }).subscribe((messages) => {
      this.messagesState.set(messages);
    });
  }

  private refreshThreads(): void {
    this.chatService.loadAgentThreads().subscribe((threads) => {
      const thread = threads.find(item => item.userId === this.userId) || null;
      this.threadState.set(thread);
      if (thread && !this.lastLoginAt) {
        this.lastLoginAt = thread.lastLoginAt || '';
      }
    });
  }

  private stopPolling(): void {
    if (this.messagesPoller !== null) {
      window.clearInterval(this.messagesPoller);
      this.messagesPoller = null;
    }
    if (this.threadPoller !== null) {
      window.clearInterval(this.threadPoller);
      this.threadPoller = null;
    }
  }

  private scrollToBottom(): void {
    try {
      if (!this.showMediaGallery()) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // no-op
    }
  }
}
