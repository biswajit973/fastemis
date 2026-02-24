import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface TesterRouteItem {
  page: string;
  route: string;
  component: string;
  access: string;
  testFocus: string;
  notes: string;
}

interface TesterSection {
  id: string;
  title: string;
  subtitle: string;
  routes: TesterRouteItem[];
}

interface ComponentGroup {
  title: string;
  description: string;
  components: string[];
}

@Component({
  selector: 'app-tester-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-surface-2 p-4 md:p-8 font-sans">
      <div class="max-w-7xl mx-auto space-y-6">
        <header class="rounded-2xl border border-border bg-surface p-5 md:p-7 shadow-sm">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold mb-4">
            QA / Backend Mapping
          </div>
          <h1 class="text-2xl md:text-3xl font-display font-bold text-primary mb-2">FastEMIs Route and Component Tester</h1>
          <p class="text-secondary text-sm md:text-base">
            Segregated test map for Home, New User, Existing User, and Agent flows.
            Every row includes route, component, access mode, test focus, and notes.
          </p>

          <div class="mt-5 flex flex-wrap gap-2">
            <a href="#home-flow" class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">Home</a>
            <a href="#new-user-flow" class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">New User</a>
            <a href="#old-user-flow" class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">Old User</a>
            <a href="#agent-flow" class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">Agent</a>
            <a href="#component-registry" class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">Components</a>
            <a href="#dev-notes" class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary no-underline hover:bg-surface-2">Dev Notes</a>
          </div>
        </header>

        <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 class="text-lg font-bold text-primary mb-3">Access Control Panel</h2>
          <div class="flex flex-wrap items-center gap-3">
            <button (click)="bypassAsUser()" class="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-95 transition-opacity">
              Login as User
            </button>
            <button (click)="bypassAsAgent()" class="px-3 py-2 rounded-lg border border-border text-primary text-sm font-medium hover:bg-surface-2 transition-colors">
              Login as Agent
            </button>
            <button (click)="clearSession()" class="px-3 py-2 rounded-lg border border-border text-secondary text-sm font-medium hover:bg-surface-2 transition-colors">
              Clear Session
            </button>
            <a routerLink="/sign-in" class="px-3 py-2 rounded-lg border border-border text-primary text-sm font-medium hover:bg-surface-2 transition-colors no-underline">
              Open Real Login
            </a>
            <a href="/sign-in" target="_blank" rel="noopener" class="px-3 py-2 rounded-lg border border-border text-primary text-sm font-medium hover:bg-surface-2 transition-colors no-underline">
              Real Login (New Tab)
            </a>
            <span class="text-xs text-muted">Use bypass only for QA speed. Real login should also be tested.</span>
          </div>
        </section>

        <section
          *ngFor="let section of sections"
          [id]="section.id"
          class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 class="text-xl font-bold text-primary mb-1">{{ section.title }}</h2>
          <p class="text-sm text-secondary mb-4">{{ section.subtitle }}</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left border-b border-border">
                  <th class="py-2 pr-4 text-primary">Page</th>
                  <th class="py-2 pr-4 text-primary">Route</th>
                  <th class="py-2 pr-4 text-primary">Component</th>
                  <th class="py-2 pr-4 text-primary">Access</th>
                  <th class="py-2 pr-4 text-primary">Test Focus</th>
                  <th class="py-2 pr-4 text-primary">Notes</th>
                  <th class="py-2 text-primary">Open</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of section.routes" class="align-top border-b border-border/60">
                  <td class="py-2 pr-4 font-medium text-primary whitespace-nowrap">{{ item.page }}</td>
                  <td class="py-2 pr-4 font-mono text-secondary whitespace-nowrap">{{ item.route }}</td>
                  <td class="py-2 pr-4 text-secondary whitespace-nowrap">{{ item.component }}</td>
                  <td class="py-2 pr-4 text-secondary whitespace-nowrap">{{ item.access }}</td>
                  <td class="py-2 pr-4 text-secondary min-w-[220px]">{{ item.testFocus }}</td>
                  <td class="py-2 pr-4 text-secondary min-w-[260px]">{{ item.notes }}</td>
                  <td class="py-2 whitespace-nowrap">
                    <div class="flex gap-2">
                      <button
                        type="button"
                        (click)="openRoute(item.route)"
                        class="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-primary hover:bg-surface-2 transition-colors">
                        Open
                      </button>
                      <a
                        [href]="item.route"
                        target="_blank"
                        rel="noopener"
                        class="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-primary hover:bg-surface-2 transition-colors no-underline">
                        New Tab
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="component-registry" class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 class="text-xl font-bold text-primary mb-1">Component Registry</h2>
          <p class="text-sm text-secondary mb-4">Major components grouped by flow for quick backend and frontend traceability.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article *ngFor="let group of componentRegistry" class="rounded-xl border border-border bg-surface-2 p-4">
              <h3 class="font-semibold text-primary mb-1">{{ group.title }}</h3>
              <p class="text-xs text-secondary mb-2">{{ group.description }}</p>
              <ul class="space-y-1 text-xs text-secondary">
                <li *ngFor="let comp of group.components" class="font-mono">{{ comp }}</li>
              </ul>
            </article>
          </div>
        </section>

        <section id="dev-notes" class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 class="text-xl font-bold text-primary mb-1">Implementation Notes for Devs</h2>
          <p class="text-sm text-secondary mb-4">Important behavior already implemented in frontend that backend should align with.</p>
          <ul class="space-y-2 text-sm text-secondary">
            <li *ngFor="let note of devNotes" class="rounded-lg border border-border bg-surface-2 p-3">{{ note }}</li>
          </ul>
        </section>

        <div class="pt-2 text-center text-sm text-muted">
          <a routerLink="/" class="hover:text-primary transition-standard inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Application
          </a>
        </div>
      </div>
    </div>
  `
})
export class TesterComponent {
  readonly sections: TesterSection[] = [
    {
      id: 'home-flow',
      title: 'Home Flow',
      subtitle: 'Public pages and discovery flow before authentication.',
      routes: [
        {
          page: 'Landing Home',
          route: '/',
          component: 'HomeComponent',
          access: 'Public',
          testFocus: 'Welcome overlay, country detect UI, location permission gate, partner list, notices in footer.',
          notes: 'Page remains blocked until location access is granted in overlay.'
        },
        {
          page: 'Partner Details',
          route: '/partner/coinvault-finance',
          component: 'PartnerComponent',
          access: 'Public (CoinVault only)',
          testFocus: 'Hero, offerings, FAQ, reviews list, INR values, partner data rendering.',
          notes: 'All non-CoinVault partner routes are blocked by guard.'
        },
        {
          page: 'Feature Documentation',
          route: '/feature-details',
          component: 'FeatureDetailsComponent',
          access: 'Public',
          testFocus: 'Backend API checklist, statuses, security notes, flow documentation.',
          notes: 'Use this page as backend handover reference.'
        }
      ]
    },
    {
      id: 'new-user-flow',
      title: 'New User Flow',
      subtitle: 'Signup and registration path after selecting CoinVault.',
      routes: [
        {
          page: 'Apply Stepper',
          route: '/partner/coinvault-finance/apply',
          component: 'ApplyComponent',
          access: 'Public',
          testFocus: '5-step form, tester bypass toggle, KYC uploads, password setup, submit.',
          notes: 'KYC now uses Aadhaar/PAN + live picture upload. OTP removed.'
        },
        {
          page: 'Apply KYC Step',
          route: '/partner/coinvault-finance/apply',
          component: 'ApplyComponent (Step 2)',
          access: 'Public',
          testFocus: 'Aadhaar number, PAN number, Aadhaar proof upload, PAN proof upload, live picture upload.',
          notes: 'If Aadhaar is image, Aadhaar back image is required. Video is recommended.'
        },
        {
          page: 'Post-Submit Dashboard',
          route: '/dashboard',
          component: 'DashboardComponent',
          access: 'Auth required',
          testFocus: 'Status card only layout, Send Payments guidance message, notice marquee.',
          notes: 'Use Login as User bypass or real login first.'
        }
      ]
    },
    {
      id: 'old-user-flow',
      title: 'Old User Flow',
      subtitle: 'Existing user login and authenticated user pages.',
      routes: [
        {
          page: 'Real Login (User)',
          route: '/sign-in?role=user',
          component: 'SignInComponent',
          access: 'Public',
          testFocus: 'Role tab = user, email/password form, validation, login routing.',
          notes: 'Existing User flow from CoinVault location modal lands here.'
        },
        {
          page: 'Dashboard',
          route: '/dashboard',
          component: 'DashboardComponent',
          access: 'User auth',
          testFocus: 'Current status card, badge blink, Send Payments CTA, status delay note.',
          notes: 'No advanced EMI card now. Status-first UX only.'
        },
        {
          page: 'Send Payments',
          route: '/dashboard/send-payments',
          component: 'SendPaymentsComponent',
          access: 'User auth',
          testFocus: 'QR + bank details, rotation timer, proof upload, transaction history.',
          notes: 'Resolves user-specific config first, then global config.'
        },
        {
          page: 'Messages',
          route: '/dashboard/messages',
          component: 'MessagesComponent',
          access: 'User auth',
          testFocus: 'User support chat flow, message send/receive.',
          notes: 'Useful to validate chat payload model.'
        },
        {
          page: 'Profile',
          route: '/dashboard/profile',
          component: 'ProfileComponent',
          access: 'User auth',
          testFocus: 'Signup details rendering and uploaded media view.',
          notes: 'Should show signup-collected fields only.'
        },
        {
          page: 'Community',
          route: '/dashboard/community',
          component: 'CommunityComponent',
          access: 'User auth',
          testFocus: 'Community messages, media preview behavior, responsive layout.',
          notes: 'User posts should remain readable on mobile.'
        },
        {
          page: 'Agreement',
          route: '/dashboard/agreement',
          component: 'AgreementComponent',
          access: 'User auth',
          testFocus: 'Agreement signing and confirmation flow.',
          notes: 'Linked to application status transitions.'
        }
      ]
    },
    {
      id: 'agent-flow',
      title: 'Agent Flow',
      subtitle: 'Agent authentication, applicant management, chat, status, and payment configuration.',
      routes: [
        {
          page: 'Real Login (Agent)',
          route: '/sign-in?role=vendor',
          component: 'SignInComponent',
          access: 'Public',
          testFocus: 'Role tab = agent, login route to /agent.',
          notes: 'Use for non-bypass verification of agent auth flow.'
        },
        {
          page: 'Agent Dashboard',
          route: '/agent',
          component: 'AgentDashboardComponent',
          access: 'Agent auth',
          testFocus: 'Applicant queue, status badges, approve/reject/hold actions.',
          notes: 'Profile Details button appears in applicant section.'
        },
        {
          page: 'Application Details',
          route: '/agent/applications/APP-8842-X',
          component: 'AgentApplicationDetailsComponent',
          access: 'Agent auth',
          testFocus: 'Full profile + media + payments + status updates + disable/delete.',
          notes: 'Includes max-2 active status cards rule.'
        },
        {
          page: 'All Chats',
          route: '/agent/chats',
          component: 'AgentAllChatsComponent',
          access: 'Agent auth',
          testFocus: 'List of user chats with quick navigation.',
          notes: 'Entry point for full-page agent chat.'
        },
        {
          page: 'Chat Page',
          route: '/agent/chats/USR-MOCK-123',
          component: 'AgentChatPageComponent',
          access: 'Agent auth',
          testFocus: 'Full-screen chat, media visibility, alias mode, delete-for-everyone.',
          notes: 'Agent badge removed by prior UI optimization.'
        },
        {
          page: 'Agent Community',
          route: '/agent/community',
          component: 'AgentCommunityComponent',
          access: 'Agent auth',
          testFocus: 'Community moderation and posting UX.',
          notes: 'Keep readability/mobile behavior aligned with user community.'
        },
        {
          page: 'Agent Payments',
          route: '/agent/payments',
          component: 'AgentPaymentsComponent',
          access: 'Agent auth',
          testFocus: 'Global/user-specific payment config, activation, scheduling, logs.',
          notes: 'Priority: user-specific over global.'
        }
      ]
    }
  ];

  readonly componentRegistry: ComponentGroup[] = [
    {
      title: 'Home and Discovery',
      description: 'Entry flow and partner discovery.',
      components: [
        'features/home/home.component.ts',
        'shared/components/navbar/navbar.component.ts',
        'features/home/sections/partner-grid/partner-grid.component.ts',
        'features/home/sections/location-check/location-check.component.ts'
      ]
    },
    {
      title: 'New User Signup',
      description: 'Registration and KYC stepper.',
      components: [
        'features/apply/apply.component.ts',
        'shared/components/stepper/stepper.component.ts',
        'shared/components/upload-zone/upload-zone.component.ts',
        'shared/validators/custom.validators.ts'
      ]
    },
    {
      title: 'Existing User Area',
      description: 'Authenticated user pages and payment flow.',
      components: [
        'features/auth/sign-in.component.ts',
        'features/dashboard/dashboard.component.ts',
        'features/dashboard/components/send-payments/send-payments.component.ts',
        'features/messages/messages.component.ts',
        'features/profile/profile.component.ts',
        'features/dashboard/components/community/community.component.ts'
      ]
    },
    {
      title: 'Agent Area',
      description: 'Applicant operations and chat/payment controls.',
      components: [
        'features/agent/agent-layout.component.ts',
        'features/agent/agent-dashboard.component.ts',
        'features/agent/agent-application-details.component.ts',
        'features/agent/components/agent-chat-page/agent-chat-page.component.ts',
        'features/agent/agent-payments.component.ts'
      ]
    },
    {
      title: 'Core Services',
      description: 'State and business logic used across flows.',
      components: [
        'core/services/auth.service.ts',
        'core/services/agent-data.service.ts',
        'core/services/application.service.ts',
        'core/services/payment-config.service.ts',
        'core/services/location.service.ts'
      ]
    }
  ];

  readonly devNotes: string[] = [
    'Location permission is mandatory at startup overlay before app unlocks.',
    'Only CoinVault is serviceable currently. Other partner routes are blocked by partner guard.',
    'CoinVault availability modal now splits flow into Existing User Login and New User Sign Up.',
    'Apply flow has tester bypass toggle for step navigation, but submit still checks required data.',
    'KYC step updated: Aadhaar number, PAN number, Aadhaar proof, PAN proof, and current live picture are required.',
    'OTP flow removed from signup stepper as requested.',
    'User dashboard is status-card-only and points users to Send Payments tab for all payments.',
    'Disabled user trap shows timeout simulation with bypass button for QA recovery.',
    'Send Payments supports rotating payment sets with user-specific over global priority and display logging.',
    'All current auth/data flows are mock/local-storage based and structured for backend API replacement.'
  ];

  constructor(private auth: AuthService, private router: Router) { }

  openRoute(route: string): void {
    void this.router.navigateByUrl(route);
  }

  bypassAsUser(): void {
    this.auth.mockLogin('user');
    void this.router.navigate(['/dashboard']);
  }

  bypassAsAgent(): void {
    this.auth.mockLogin('vendor');
    void this.router.navigate(['/agent']);
  }

  clearSession(): void {
    this.auth.logout();
  }
}
