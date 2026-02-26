import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FieldRow {
  field: string;
  frontend: string;
  backendNeed: string;
}

interface StatusRow {
  code: string;
  label: string;
  meaning: string;
}

interface EndpointRow {
  method: string;
  path: string;
  purpose: string;
}

@Component({
  selector: 'app-feature-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-surface-2 py-8 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto space-y-6">

        <header class="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-accent mb-2">Developer Reference</p>
              <h1 class="text-2xl md:text-3xl font-bold text-primary mb-2">All Feature Details Page</h1>
              <p class="text-sm text-secondary leading-relaxed max-w-3xl">
                This page explains all important frontend features in easy English.
                Backend and API developers can use this as a practical checklist for database design, APIs, realtime events, and role-based permissions.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <a routerLink="/" class="px-3 py-2 rounded-lg border border-border text-sm text-primary no-underline hover:bg-surface-2">Home</a>
              <a routerLink="/agent" class="px-3 py-2 rounded-lg border border-border text-sm text-primary no-underline hover:bg-surface-2">Agent Panel</a>
            </div>
          </div>
        </header>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">1. Signup and Profile Data</h2>
          <p class="text-sm text-secondary mb-4">
            These are fields currently collected in frontend forms and profile sections.
          </p>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left border-b border-border">
                  <th class="py-2 pr-4 text-primary">Field</th>
                  <th class="py-2 pr-4 text-primary">Frontend Behavior</th>
                  <th class="py-2 text-primary">Backend Requirement</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of signupFields" class="border-b border-border/60 align-top">
                  <td class="py-2 pr-4 font-medium text-primary">{{ row.field }}</td>
                  <td class="py-2 pr-4 text-secondary">{{ row.frontend }}</td>
                  <td class="py-2 text-secondary">{{ row.backendNeed }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">2. Application Status Flow</h2>
          <p class="text-sm text-secondary mb-4">
            Frontend is aligned to this status order. Keep exact status codes to avoid UI break.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <article *ngFor="let s of statuses" class="rounded-xl border border-border bg-surface-2 p-4">
              <div class="text-xs font-mono text-muted mb-1">{{ s.code }}</div>
              <h3 class="font-semibold text-primary mb-1">{{ s.label }}</h3>
              <p class="text-sm text-secondary">{{ s.meaning }}</p>
            </article>
          </div>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">3. Agent Side Features (Backend Support Needed)</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div *ngFor="let item of agentFeatureNeeds" class="rounded-xl border border-border bg-surface-2 p-4">
              <h3 class="font-semibold text-primary mb-1">{{ item.title }}</h3>
              <p class="text-secondary">{{ item.detail }}</p>
            </div>
          </div>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">4. User Side Features (Backend Support Needed)</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div *ngFor="let item of userFeatureNeeds" class="rounded-xl border border-border bg-surface-2 p-4">
              <h3 class="font-semibold text-primary mb-1">{{ item.title }}</h3>
              <p class="text-secondary">{{ item.detail }}</p>
            </div>
          </div>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">5. Suggested Core APIs</h2>
          <p class="text-sm text-secondary mb-4">
            Suggested routes below are simple and practical. You can rename, but keep the same capability.
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left border-b border-border">
                  <th class="py-2 pr-4 text-primary">Method</th>
                  <th class="py-2 pr-4 text-primary">Path</th>
                  <th class="py-2 text-primary">Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let api of suggestedApis" class="border-b border-border/60 align-top">
                  <td class="py-2 pr-4 font-mono text-primary">{{ api.method }}</td>
                  <td class="py-2 pr-4 font-mono text-secondary">{{ api.path }}</td>
                  <td class="py-2 text-secondary">{{ api.purpose }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">6. Realtime Events</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div *ngFor="let event of realtimeEvents" class="rounded-xl border border-border bg-surface-2 p-4">
              <h3 class="font-semibold text-primary mb-1">{{ event.title }}</h3>
              <p class="text-secondary">{{ event.detail }}</p>
            </div>
          </div>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">7. Role and Security Rules</h2>
          <ul class="space-y-2 text-sm text-secondary">
            <li *ngFor="let rule of securityRules" class="rounded-lg border border-border bg-surface-2 p-3">{{ rule }}</li>
          </ul>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">8. Backend MVP Checklist</h2>
          <ol class="space-y-2 text-sm text-secondary list-decimal pl-5">
            <li *ngFor="let item of backendChecklist">{{ item }}</li>
          </ol>
        </section>

      </div>
    </div>
  `
})
export class FeatureDetailsComponent {
  signupFields: FieldRow[] = [
    {
      field: 'Full Name, Mobile, Email, Tax ID, National ID, DOB, Address',
      frontend: 'Collected during apply flow and visible in user profile and agent profile details.',
      backendNeed: 'Store in user table with validation and unique checks for IDs where required.'
    },
    {
      field: 'Marital Status',
      frontend: 'Option values: married or unmarried.',
      backendNeed: 'Store enum: married/unmarried.'
    },
    {
      field: 'What your better half does',
      frontend: 'Textarea. Example style: she is a housewife, she is a teacher.',
      backendNeed: 'Store nullable text field spouse_occupation.'
    },
    {
      field: 'What you do',
      frontend: 'Textarea. Example style: I am a student, I do job in bank.',
      backendNeed: 'Store occupation description as text.'
    },
    {
      field: 'Monthly Salary in INR',
      frontend: 'Numeric input. Used in profile and payment context.',
      backendNeed: 'Store integer salary_inr with min-value validation.'
    },
    {
      field: 'Uploaded Media',
      frontend: 'Images, video, and attachments shown in user profile details.',
      backendNeed: 'Store media metadata and secure file URLs (signed URL preferred).'
    }
  ];

  statuses: StatusRow[] = [
    { code: 'new_unpaid', label: 'New Request / Unpaid', meaning: 'Application created, payment or process not started.' },
    { code: 'kyc_paid', label: 'KYC Done / Paid', meaning: 'KYC and first payment step completed.' },
    { code: 'agreement_pending', label: 'Agreement Pending', meaning: 'User must review and sign EMI plan agreement.' },
    { code: 'agreement_done', label: 'Agreement Done', meaning: 'Agreement and mandate completed by user.' },
    { code: 'bgv_in_progress', label: 'BGV In Progress', meaning: 'Background verification is running. Agent can reject with reason.' },
    { code: 'completed', label: 'Approved BGV / Completed', meaning: 'Verification finished and process completed.' },
    { code: 'rejected', label: 'Rejected', meaning: 'Application rejected by agent/BGV with reason message.' }
  ];

  agentFeatureNeeds = [
    {
      title: 'Applicant Queue',
      detail: 'Agent sees applicant list and actions: approve, reject, hold. Profile Details button appears in applicant area.'
    },
    {
      title: 'Profile Details',
      detail: 'Agent can always view user personal details, payment details, and all uploaded media in scrollable form.'
    },
    {
      title: 'User Controls',
      detail: 'Agent can disable user or permanently delete user. Disable keeps data visible for agent.'
    },
    {
      title: 'Disable Login UX',
      detail: 'When disabled user logs in, frontend shows loading stuck at 90 percent then timeout message. This simulates locked-account handling until account status changes.'
    },
    {
      title: 'Chat with Any User',
      detail: 'Agent gets all chats page and full-page chat view with date/time, media, delete-for-everyone, and alias name option.'
    },
    {
      title: 'Last Login Visibility',
      detail: 'Agent can see each target user last login time in chat/details context.'
    },
    {
      title: 'Status Updates',
      detail: 'Agent can create max 2 active status cards per user. Each status has heading, details, and badge text.'
    },
    {
      title: 'Notice Marquee',
      detail: 'Agent can raise one active notice per user. User action Done/Ignore removes the notice.'
    }
  ];

  userFeatureNeeds = [
    {
      title: 'Profile Tab',
      detail: 'User profile details tab should show basic signup details only, in clean structured view.'
    },
    {
      title: 'Current Status Card',
      detail: 'Dashboard shows status heading plus status details managed by agent updates.'
    },
    {
      title: 'Messages and Community',
      detail: 'User gets support chat and community chat pages with responsive mobile-friendly UI.'
    },
    {
      title: 'Agreement Flow',
      detail: 'User must acknowledge terms and complete digital EMI plan agreement step before completion.'
    },
    {
      title: 'Notices',
      detail: 'Notice tab shows active agent notice with Done/Ignore actions.'
    },
    {
      title: 'Partner and Reviews',
      detail: 'Partner pages render customer reviews and partner details. CoinVault includes large static review dataset.'
    }
  ];

  suggestedApis: EndpointRow[] = [
    { method: 'POST', path: '/api/auth/login', purpose: 'Role-based login for user and agent sessions.' },
    { method: 'POST', path: '/api/users', purpose: 'Create user during apply/signup with all profile fields.' },
    { method: 'GET', path: '/api/users/:id', purpose: 'Get full user profile for user page and agent profile details page.' },
    { method: 'PATCH', path: '/api/users/:id', purpose: 'Update user fields, including occupation and salary.' },
    { method: 'PATCH', path: '/api/users/:id/disable', purpose: 'Enable or disable user account.' },
    { method: 'DELETE', path: '/api/users/:id', purpose: 'Permanent delete user and all linked data.' },
    { method: 'POST', path: '/api/users/:id/media', purpose: 'Upload media metadata and return secure file URL.' },
    { method: 'GET', path: '/api/users/:id/media', purpose: 'List uploaded media for agent and user profile views.' },
    { method: 'GET', path: '/api/applications', purpose: 'List applicant queue for agent dashboard.' },
    { method: 'PATCH', path: '/api/applications/:id/status', purpose: 'Update status flow and keep timeline in sync.' },
    { method: 'POST', path: '/api/applications/:id/reject-bgv', purpose: 'Reject BGV with reason text.' },
    { method: 'GET', path: '/api/chats', purpose: 'Get all chats list for agent All Chats page.' },
    { method: 'GET', path: '/api/chats/:chatId/messages', purpose: 'Get message list with sender, timestamp, type, and media.' },
    { method: 'POST', path: '/api/chats/:chatId/messages', purpose: 'Send text or media message.' },
    { method: 'DELETE', path: '/api/chats/:chatId/messages/:messageId', purpose: 'Delete message for everyone.' },
    { method: 'PATCH', path: '/api/chats/:chatId/alias', purpose: 'Set agent alias name for specific user chat.' },
    { method: 'GET', path: '/api/users/:id/notices', purpose: 'Get active notice for user notice tab.' },
    { method: 'POST', path: '/api/users/:id/notices', purpose: 'Create notice (only one active notice allowed).' },
    { method: 'POST', path: '/api/users/:id/notices/:noticeId/action', purpose: 'User action Done/Ignore and auto delete notice.' },
    { method: 'GET', path: '/api/users/:id/status-updates', purpose: 'Get max 2 active status cards for user dashboard.' },
    { method: 'POST', path: '/api/users/:id/status-updates', purpose: 'Agent creates status heading/details/badge.' },
    { method: 'DELETE', path: '/api/users/:id/status-updates/:statusId', purpose: 'Remove old status update.' }
  ];

  realtimeEvents = [
    {
      title: 'chat_message_created',
      detail: 'Push new message instantly to both sides in active chat.'
    },
    {
      title: 'chat_message_deleted_for_everyone',
      detail: 'Remove message/media from both sides without extra notification.'
    },
    {
      title: 'user_status_changed',
      detail: 'Update status tracker and current status card in real-time.'
    },
    {
      title: 'notice_changed',
      detail: 'Show/hide marquee notice quickly when agent creates or user responds.'
    },
    {
      title: 'user_disabled_state_changed',
      detail: 'If disabled by agent, block next user session immediately.'
    }
  ];

  securityRules = [
    'Only agent role can disable/delete users, set application status, post notices, and manage status updates.',
    'Only message owner or agent moderation role can use delete-for-everyone for chat content.',
    'Keep strict ownership checks so one user cannot read another user data.',
    'Store audit logs for sensitive actions: disable user, delete user, reject BGV, delete chat message.',
    'Use signed URLs and short expiry for media files.',
    'Rate-limit login, chat send, and media upload endpoints.'
  ];

  backendChecklist = [
    'Create user, application, media, chat, notice, and status update tables.',
    'Implement role-based JWT/session auth for user and agent.',
    'Build status flow API using exact status codes used by frontend.',
    'Build chat APIs and websocket events for realtime messages and deletions.',
    'Build notice API with one-active-notice rule per user.',
    'Build status-update API with max-2-active-statuses rule per user.',
    'Add admin-safe delete cascade for full user deletion.',
    'Expose profile aggregate endpoint for agent profile details page.',
    'Add basic monitoring and audit logs for critical agent actions.'
  ];
}
