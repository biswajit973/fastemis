import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { partnerGuard } from './core/guards/partner.guard';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        title: 'FastEMIs - Instant Finance Online',
        data: { breadcrumb: 'Home' }
    },
    {
        path: 'partner/:slug',
        loadComponent: () => import('./features/partner/partner.component').then(m => m.PartnerComponent),
        canActivate: [partnerGuard],
        data: { breadcrumb: 'Partner' }
    },
    {
        path: 'partner/:slug/apply',
        loadComponent: () => import('./features/apply/apply.component').then(m => m.ApplyComponent),
        canActivate: [partnerGuard],
        title: 'FastEMIs - Registration',
        data: { breadcrumb: 'Apply' }
    },
    {
        path: 'sign-in',
        loadComponent: () => import('./features/auth/sign-in.component').then(m => m.SignInComponent),
        title: 'FastEMIs - Sign In',
        data: { breadcrumb: 'Sign In' }
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard],
        title: 'FastEMIs - Dashboard',
        data: { breadcrumb: 'Dashboard' }
    },
    {
        path: 'dashboard/messages',
        loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent),
        canActivate: [authGuard],
        title: 'FastEMIs - Support',
        data: { breadcrumb: 'Messages' }
    },
    {
        path: 'dashboard/profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [authGuard],
        title: 'FastEMIs - Profile',
        data: { breadcrumb: 'Profile Details' }
    },
    {
        path: 'dashboard/community',
        loadComponent: () => import('./features/dashboard/components/community/community.component').then(m => m.CommunityComponent),
        canActivate: [authGuard],
        title: 'FastEMIs - Community',
        data: { breadcrumb: 'Community' }
    },
    {
        path: 'dashboard/send-payments',
        loadComponent: () => import('./features/dashboard/components/send-payments/send-payments.component').then(m => m.SendPaymentsComponent),
        canActivate: [authGuard],
        title: 'FastEMIs - Send Payments',
        data: { breadcrumb: 'Send Payments' }
    },
    {
        path: 'dashboard/agreement',
        loadComponent: () => import('./features/agreement/agreement.component').then(m => m.AgreementComponent),
        canActivate: [authGuard],
        title: 'FastEMIs - Secure Digital Signature',
        data: { breadcrumb: 'Agreement' }
    },
    {
        path: 'tester',
        loadComponent: () => import('./features/tester/tester.component').then(m => m.TesterComponent),
        title: 'FastEMIs - Developer Tester Hub',
        data: { breadcrumb: 'Tester' }
    },
    {
        path: 'tester/api',
        loadComponent: () => import('./features/tester/api-test.component').then(m => m.ApiTestComponent),
        title: 'FastEMIs - API Fetch Test',
        data: { breadcrumb: 'API Test' }
    },
    {
        path: 'feature-details',
        loadComponent: () => import('./features/feature-details/feature-details.component').then(m => m.FeatureDetailsComponent),
        title: 'FastEMIs - All Feature Details',
        data: { breadcrumb: 'Feature Details' }
    },
    {
        path: 'agent',
        loadComponent: () => import('./features/agent/agent-layout.component').then(m => m.AgentLayoutComponent),
        title: 'FastEMIs - Vendor Dashboard',
        data: { breadcrumb: 'Agent' },
        children: [
            {
                path: '',
                loadComponent: () => import('./features/agent/agent-dashboard.component').then(m => m.AgentDashboardComponent),
                data: { breadcrumb: 'Applicants' }
            },
            {
                path: 'applications/:id',
                loadComponent: () => import('./features/agent/agent-application-details.component').then(m => m.AgentApplicationDetailsComponent),
                data: { breadcrumb: 'Profile Details' }
            },
            {
                path: 'chats',
                loadComponent: () => import('./features/agent/components/agent-all-chats/agent-all-chats.component').then(m => m.AgentAllChatsComponent),
                data: { breadcrumb: 'All Chats' }
            },
            {
                path: 'chats/:userId',
                loadComponent: () => import('./features/agent/components/agent-chat-page/agent-chat-page.component').then(m => m.AgentChatPageComponent),
                data: { breadcrumb: 'Chat' }
            },
            {
                path: 'community',
                loadComponent: () => import('./features/agent/components/agent-community/agent-community.component').then(m => m.AgentCommunityComponent),
                data: { breadcrumb: 'Community' }
            },
            {
                path: 'payments',
                loadComponent: () => import('./features/agent/agent-payments.component').then(m => m.AgentPaymentsComponent),
                data: { breadcrumb: 'Payment Config' }
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
