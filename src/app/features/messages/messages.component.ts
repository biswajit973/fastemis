import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatMessage, ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="flex flex-col h-screen bg-surface-2">
      <header class="bg-surface border-b border-border h-16 flex items-center px-4 shrink-0 sticky top-0 z-20">
        <a routerLink="/dashboard" class="mr-4 text-secondary hover:text-primary transition-standard">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </a>
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-primary-light/20 flex items-center justify-center text-primary font-bold">{{ agentInitials() }}</div>
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-surface rounded-full"></div>
          </div>
          <div>
            <h2 class="font-bold text-primary leading-tight">{{ agentDisplayName() }}</h2>
            <p class="text-xs text-secondary" *ngIf="agentDisplayName() === 'FastEMIs Agent'">Connected Support</p>
            <p class="text-xs text-secondary" *ngIf="agentDisplayName() !== 'FastEMIs Agent'">Support Executive</p>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 space-y-4" #scrollContainer>
        <div class="text-center mb-6">
          <span class="bg-surface border border-border px-3 py-1 rounded-full text-xs font-medium text-secondary shadow-sm">Today</span>
        </div>

        <div *ngFor="let msg of messages()" class="flex flex-col max-w-[85%]"
             [ngClass]="{
               'self-end items-end': msg.sender === 'user',
               'self-start items-start': msg.sender === 'agent' || msg.sender === 'system',
               'mx-auto text-center !max-w-full': msg.sender === 'system'
             }">
          <ng-container *ngIf="msg.sender !== 'system'">
            <div class="p-3 rounded-2xl shadow-sm text-sm"
                 [ngClass]="{
                   'bg-primary text-white rounded-tr-sm': msg.sender === 'user',
                   'bg-surface border border-border text-primary rounded-tl-sm': msg.sender === 'agent'
                 }">
              <span *ngIf="msg.type === 'text'">{{ msg.content }}</span>
              <div *ngIf="msg.type === 'media'" class="space-y-2">
                <img *ngIf="msg.mediaUrl && isImage(msg.mediaName)" [src]="msg.mediaUrl" class="rounded max-h-48 object-cover">
                <video *ngIf="msg.mediaUrl && isVideo(msg.mediaName)" [src]="msg.mediaUrl" controls class="rounded max-h-52 bg-black"></video>
                <div class="text-xs font-mono bg-black/10 px-2 py-1 rounded w-max">{{ msg.mediaName || 'Attachment' }}</div>
              </div>
            </div>
            <div class="text-[10px] text-muted mt-1 flex items-center gap-1 mx-1">
              {{ formatDateTime(msg.timestamp) }}
              <svg *ngIf="msg.sender === 'user'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [ngClass]="msg.read ? 'text-accent' : 'text-muted'">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </ng-container>

          <ng-container *ngIf="msg.sender === 'system'">
            <div class="bg-surface-3 border border-border text-secondary text-xs px-4 py-2 rounded-lg my-2 mx-auto">{{ msg.content }}</div>
          </ng-container>
        </div>
      </main>

      <footer class="bg-surface border-t border-border p-3 flex items-center gap-2 shrink-0">
        <div class="flex-1 bg-surface-2 rounded-full border border-border px-4 py-2 flex items-center">
          <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type a message..." class="w-full bg-transparent border-none outline-none text-sm text-primary placeholder-muted" />
        </div>
        <button class="w-10 h-10 rounded-full flex items-center justify-center transition-standard shrink-0"
          [ngClass]="newMessage.trim() ? 'bg-primary text-white shadow-md' : 'bg-surface-3 text-muted'"
          [disabled]="!newMessage.trim()"
          (click)="sendMessage()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </footer>
    </div>
  `
})
export class MessagesComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  newMessage: string = '';
  agentTyping = signal<boolean>(false);
  activeUserId = signal<string>('USR-MOCK-123');
  private pollingInterval: any;

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) { }

  ngOnInit() {
    const currentUser = this.authService.currentUserSignal();
    this.activeUserId.set(currentUser?.id || 'USR-MOCK-123');

    this.scrollToBottom();
    this.chatService.markAllAsRead(this.activeUserId());
    this.startPolling();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  messages(): ChatMessage[] {
    return this.chatService.getMessages(this.activeUserId());
  }

  agentDisplayName(): string {
    const currentUser = this.authService.currentUserSignal();
    return currentUser?.assignedAgentName || this.chatService.getAgentAlias(this.activeUserId());
  }

  agentInitials(): string {
    const name = this.agentDisplayName();
    if (name === 'FastEMIs Agent') return 'FA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.chatService.sendMessage(this.activeUserId(), {
      sender: 'user',
      content: this.newMessage.trim(),
      type: 'text'
    });

    this.newMessage = '';
    this.agentTyping.set(true);

    setTimeout(() => {
      this.chatService.markAllAsRead(this.activeUserId());
      this.chatService.sendMessage(this.activeUserId(), {
        sender: 'agent',
        senderName: this.agentDisplayName(),
        content: this.getAutoReply(),
        type: 'text'
      });
      this.agentTyping.set(false);
    }, 2000 + Math.random() * 1200);
  }

  getAutoReply(): string {
    const replies = [
      'Our team is currently reviewing your application.',
      'You will receive a notification as soon as the status updates.',
      'Thanks, we have received your latest document.',
      'Please refer to the dashboard for your real-time application status.'
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  startPolling() {
    this.pollingInterval = setInterval(() => {
      if (Math.random() > 0.95) {
        this.chatService.sendMessage(this.activeUserId(), {
          sender: 'system',
          content: 'Background verification event updated.',
          type: 'text'
        });
      }
    }, 10000);
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isImage(name?: string): boolean {
    return !!name && /(png|jpg|jpeg|gif|webp)$/i.test(name);
  }

  isVideo(name?: string): boolean {
    return !!name && /(mp4|webm|ogg|mov)$/i.test(name);
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}
