import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgentDataService, AgentUserProfile } from '../../../../core/services/agent-data.service';
import { AgentChatComponent } from '../agent-chat/agent-chat.component';

@Component({
  selector: 'app-agent-chat-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AgentChatComponent],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto" *ngIf="user(); else noUser">
      <div class="mb-4 flex items-center justify-between gap-4">
        <div>
          <a routerLink="/agent/chats" class="text-sm text-secondary hover:text-primary no-underline inline-flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to All Chats
          </a>
          <h1 class="text-2xl font-bold text-primary">Chat with {{ user()!.fullName }}</h1>
          <p class="text-sm text-secondary">This is a full-page chat workspace for agent-to-user communication.</p>
        </div>
        <a *ngIf="applicationId()" [routerLink]="['/agent/applications', applicationId()]" class="px-4 py-2 rounded-lg border border-border bg-surface text-primary text-sm font-medium no-underline hover:border-primary transition-colors">
          Open Profile Details
        </a>
      </div>

      <app-agent-chat
        [userId]="user()!.id"
        [userName]="user()!.fullName"
        [lastLoginAt]="user()!.lastLoginAt"
        [fullPage]="true">
      </app-agent-chat>
    </div>

    <ng-template #noUser>
      <div class="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto py-16 text-center">
        <h2 class="text-2xl font-bold text-primary mb-2">Chat user not found</h2>
        <p class="text-secondary mb-6">The selected chat is unavailable.</p>
        <a routerLink="/agent/chats" class="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white no-underline">Back to All Chats</a>
      </div>
    </ng-template>
  `
})
export class AgentChatPageComponent implements OnInit {
  user = signal<AgentUserProfile | null>(null);
  applicationId = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agentData: AgentDataService
  ) { }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.router.navigate(['/agent/chats']);
      return;
    }

    const user = this.agentData.getUserById(userId);
    if (!user) {
      return;
    }

    this.user.set(user);
    const app = this.agentData.getApplications().find(item => item.userId === userId);
    this.applicationId.set(app?.applicationId || '');
  }
}
