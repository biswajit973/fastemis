import { AfterViewChecked, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage, ChatService } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-agent-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-surface border border-border rounded-xl shadow-sm flex flex-col overflow-hidden relative"
      [ngClass]="fullPage ? 'h-[calc(100vh-13rem)] md:h-[calc(100vh-12rem)]' : 'h-[680px]'">
      <div *ngIf="showAliasPopup()" class="absolute inset-0 z-20 bg-surface/85 backdrop-blur-sm flex items-center justify-center p-6">
        <div class="bg-surface border border-border rounded-xl p-6 shadow-xl max-w-sm w-full">
           <h3 class="text-lg font-bold text-primary mb-2">Join Chat Session</h3>
           <p class="text-sm text-secondary mb-4">Enter any display name. Messages will be sent under this name and reflected in the user account.</p>
           <input type="text" [(ngModel)]="customAgentName" placeholder="E.g. Verification Desk" class="w-full text-sm rounded bg-surface border border-border px-4 py-2 mb-4 focus:outline-none focus:border-primary">
           <button (click)="connectToChat()" [disabled]="!customAgentName.trim()" class="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50">Start Chat</button>
        </div>
      </div>

      <div class="bg-surface-2 px-5 py-3 border-b border-border flex justify-between items-start shrink-0 gap-2">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">{{ initials(userName) }}</div>
          <div class="min-w-0">
            <h2 class="font-bold text-primary text-sm leading-tight truncate">{{ userName || 'Unknown User' }}</h2>
            <p class="text-[11px] text-secondary truncate">Last login: {{ formatDateTime(lastLoginAt) }}</p>
            <p class="text-[10px] text-muted truncate">Chat as: {{ activeAgentName() }}</p>
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button (click)="showAliasPopup.set(true)" class="px-2.5 py-1 text-xs border border-border rounded bg-surface hover:bg-surface-3 text-secondary">Rename</button>
          <button (click)="showMediaGallery.set(!showMediaGallery())" class="px-2.5 py-1 text-xs border border-border rounded bg-surface hover:bg-surface-3 text-secondary">
            Media ({{ sharedMedia().length }})
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-hidden relative">
        <div class="flex-1 overflow-y-auto p-4 space-y-4 h-full" [class.hidden]="showMediaGallery()" #scrollContainer>
          <div class="text-center mb-6">
             <span class="bg-surface-2 px-3 py-1 rounded-full text-[10px] font-medium text-secondary border border-border">Delete removes messages for everyone silently</span>
          </div>

          <div *ngFor="let msg of messages()" class="flex flex-col max-w-[85%] relative group"
              [ngClass]="{
                'self-start items-start': msg.sender === 'user',
                'self-end items-end': msg.sender === 'agent' || msg.sender === 'system',
                'mx-auto text-center !max-w-full': msg.sender === 'system'
              }">

            <button *ngIf="msg.sender !== 'system'" (click)="deleteMessage(msg.id)" class="absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-error text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10" [ngClass]="msg.sender === 'agent' ? '-left-3' : '-right-3'" title="Delete for everyone">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <ng-container *ngIf="msg.sender !== 'system'">
              <div *ngIf="msg.sender === 'agent'" class="text-[10px] text-muted mb-1 mx-1">{{ msg.senderName || activeAgentName() }}</div>
              <div class="p-3 rounded-2xl shadow-sm text-sm"
                   [ngClass]="{
                     'bg-surface border border-border text-primary rounded-tl-sm': msg.sender === 'user',
                     'bg-primary text-white rounded-tr-sm': msg.sender === 'agent'
                   }">
                <span *ngIf="msg.type === 'text'">{{ msg.content }}</span>
                <div *ngIf="msg.type === 'media'" class="space-y-2">
                  <img *ngIf="msg.mediaUrl && isImage(msg.mediaName)" [src]="msg.mediaUrl" class="rounded max-h-48 object-cover">
                  <video *ngIf="msg.mediaUrl && isVideo(msg.mediaName)" [src]="msg.mediaUrl" controls class="rounded max-h-52 bg-black"></video>
                  <div *ngIf="!msg.mediaUrl || (!isImage(msg.mediaName) && !isVideo(msg.mediaName))" class="text-xs flex items-center gap-2 bg-black/10 rounded px-2 py-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <span>{{ msg.mediaName || 'Attachment' }}</span>
                  </div>
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
          <div class="p-4 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
            <div *ngIf="sharedMedia().length === 0" class="col-span-full py-12 text-center text-secondary text-sm">No shared media in this chat.</div>
            <div *ngFor="let media of sharedMedia()" class="border border-border rounded-lg overflow-hidden relative group">
              <img *ngIf="media.mediaUrl && isImage(media.mediaName)" [src]="media.mediaUrl" class="w-full h-32 object-cover">
              <video *ngIf="media.mediaUrl && isVideo(media.mediaName)" [src]="media.mediaUrl" class="w-full h-32 object-cover bg-black" controls></video>
              <div *ngIf="!media.mediaUrl || (!isImage(media.mediaName) && !isVideo(media.mediaName))" class="h-32 bg-surface-3 flex items-center justify-center text-secondary">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
              <button (click)="deleteMessage(media.id)" class="absolute top-2 right-2 bg-error text-white w-6 h-6 rounded flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <div class="p-2 bg-surface border-t border-border text-[10px] font-mono truncate text-secondary">{{ media.mediaName || 'Attachment' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-surface border-t border-border p-3 flex items-center gap-2 shrink-0">
        <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept="image/*,video/*,.pdf,.doc,.docx,.txt">
        <button (click)="fileInput.click()" class="w-10 h-10 rounded-full text-secondary hover:bg-surface-3 flex items-center justify-center shrink-0" title="Share Media">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
        </button>
        <div class="flex-1 bg-surface-2 rounded-full border border-border px-4 py-2 flex items-center">
          <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" [placeholder]="'Message as ' + activeAgentName()" class="w-full bg-transparent border-none outline-none text-sm text-primary placeholder-muted" />
        </div>
        <button class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          [ngClass]="newMessage.trim() ? 'bg-primary text-white shadow-md' : 'bg-surface-3 text-muted'"
          [disabled]="!newMessage.trim()"
          (click)="sendMessage()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  `
})
export class AgentChatComponent implements OnChanges, AfterViewChecked {
  @Input() userId: string = '';
  @Input() userName: string = '';
  @Input() lastLoginAt: string = '';
  @Input() fullPage: boolean = false;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  customAgentName: string = '';
  newMessage: string = '';

  showMediaGallery = signal<boolean>(false);
  showAliasPopup = signal<boolean>(false);

  constructor(private chatService: ChatService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      const alias = this.chatService.getAgentAlias(this.userId);
      this.customAgentName = alias;
      this.showAliasPopup.set(!alias || alias === 'FastEMIs Agent');
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  messages(): ChatMessage[] {
    return this.chatService.getMessages(this.userId).filter(m => !m.hiddenFromAgent);
  }

  sharedMedia(): ChatMessage[] {
    return this.chatService.getSharedMedia(this.userId);
  }

  activeAgentName(): string {
    return this.chatService.getAgentAlias(this.userId);
  }

  connectToChat() {
    if (!this.userId || !this.customAgentName.trim()) {
      return;
    }
    this.chatService.setAgentAlias(this.userId, this.customAgentName.trim());
    this.showAliasPopup.set(false);
  }

  sendMessage() {
    if (!this.userId || !this.newMessage.trim()) {
      return;
    }

    this.chatService.sendMessage(this.userId, {
      sender: 'agent',
      senderName: this.activeAgentName(),
      content: this.newMessage.trim(),
      type: 'text'
    });

    this.newMessage = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.userId) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    this.chatService.sendMessage(this.userId, {
      sender: 'agent',
      senderName: this.activeAgentName(),
      content: 'Shared media',
      type: 'media',
      mediaName: file.name,
      mediaUrl: objectUrl
    });

    input.value = '';
  }

  deleteMessage(messageId: string) {
    this.chatService.deleteMessageForEveryone(this.userId, messageId);
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

  private scrollToBottom() {
    try {
      if (!this.showMediaGallery()) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (e) {
      // no-op
    }
  }
}
