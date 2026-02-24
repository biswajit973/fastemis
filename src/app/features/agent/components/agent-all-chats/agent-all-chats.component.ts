import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AgentDataService, AgentUserProfile } from '../../../../core/services/agent-data.service';
import { ChatService } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-agent-all-chats',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-display font-bold text-primary mb-1">All Chats</h1>
        <p class="text-secondary">Open any user conversation in a dedicated full-page chat view.</p>
      </div>

      <div class="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div class="divide-y divide-border">
          <div *ngFor="let user of users()" class="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-surface-2/60 transition-colors">
            <div>
              <div class="font-semibold text-primary">{{ user.fullName }}</div>
              <div class="text-xs text-secondary">{{ user.mobile }} • Last login: {{ formatDateTime(user.lastLoginAt) }}</div>
              <div class="text-xs text-muted mt-1 truncate max-w-[36rem]">{{ lastMessagePreview(user.id) }}</div>
            </div>
            <a [routerLink]="['/agent/chats', user.id]" class="self-start md:self-center px-4 py-2 rounded-lg border border-border bg-surface text-primary text-sm font-medium no-underline hover:border-primary hover:text-primary-light transition-colors">
              Open Chat
            </a>
          </div>

          <div *ngIf="users().length === 0" class="p-8 text-center text-secondary">No users available.</div>
        </div>
      </div>
    </div>
  `
})
export class AgentAllChatsComponent {
  constructor(
    private agentData: AgentDataService,
    private chatService: ChatService
  ) { }

  users(): AgentUserProfile[] {
    return this.agentData.getApplications()
      .map(app => this.agentData.getUserById(app.userId))
      .filter((user): user is AgentUserProfile => !!user);
  }

  lastMessagePreview(userId: string): string {
    const messages = this.chatService.getMessages(userId);
    const last = messages[messages.length - 1];
    if (!last) return 'No messages yet';
    if (last.type === 'media') return `${last.senderName || last.sender}: shared media (${last.mediaName || 'attachment'})`;
    return `${last.senderName || last.sender}: ${last.content}`;
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
}
