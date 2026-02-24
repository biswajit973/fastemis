import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardNavComponent } from '../dashboard/components/dashboard-nav/dashboard-nav.component';
import { AuthService } from '../../core/services/auth.service';
import { AgentDataService, AgentUserProfile } from '../../core/services/agent-data.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DashboardNavComponent],
  template: `
    <app-dashboard-nav></app-dashboard-nav>

    <main class="pt-20 md:pt-24 pb-24 md:pb-12 md:pl-64 min-h-screen bg-surface-2">
      <div class="container max-w-4xl py-6">
        <div class="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-border bg-surface-2">
            <h1 class="text-2xl font-bold text-primary">Profile Details</h1>
            <p class="text-sm text-secondary">Basic details submitted during signup.</p>
          </div>

          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm" *ngIf="profile(); else noProfile">
            <div>
              <span class="block text-secondary mb-1">Full Name</span>
              <span class="font-medium text-primary">{{ profile()!.fullName }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">Email</span>
              <span class="font-medium text-primary">{{ profile()!.email }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">Mobile Number</span>
              <span class="font-medium text-primary">{{ profile()!.mobile }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">Date of Birth</span>
              <span class="font-medium text-primary">{{ profile()!.dob }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">Tax ID</span>
              <span class="font-medium text-primary font-mono">{{ profile()!.taxId }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">National ID</span>
              <span class="font-medium text-primary font-mono">{{ profile()!.nationalId }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">Employment Type</span>
              <span class="font-medium text-primary">{{ profile()!.employmentType | titlecase }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">Marital Status</span>
              <span class="font-medium text-primary">{{ profile()!.maritalStatus | titlecase }}</span>
            </div>
            <div *ngIf="profile()!.maritalStatus === 'married'" class="sm:col-span-2">
              <span class="block text-secondary mb-1">Better Half Occupation</span>
              <span class="font-medium text-primary">{{ profile()!.spouseOccupation || '-' }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">Occupation</span>
              <span class="font-medium text-primary">{{ profile()!.occupation }}</span>
            </div>
            <div class="sm:col-span-2">
              <span class="block text-secondary mb-1">Address</span>
              <span class="font-medium text-primary">{{ profile()!.address }}</span>
            </div>
          </div>
        </div>

        <ng-template #noProfile>
          <div class="py-10 text-center text-secondary">Profile details are unavailable.</div>
        </ng-template>
      </div>
    </main>
  `
})
export class ProfileComponent implements OnInit {
  profile = signal<AgentUserProfile | null>(null);

  constructor(
    private authService: AuthService,
    private agentDataService: AgentDataService
  ) { }

  ngOnInit(): void {
    const userId = this.authService.currentUserSignal()?.id;
    if (!userId) {
      return;
    }

    const profile = this.agentDataService.getUserById(userId);
    this.profile.set(profile);
  }
}
