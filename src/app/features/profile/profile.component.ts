import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardNavComponent } from '../dashboard/components/dashboard-nav/dashboard-nav.component';
import { AuthService } from '../../core/services/auth.service';

interface UserProfileView {
  fullName: string;
  email: string;
  mobile: string;
  maritalStatus: string;
  occupation: string;
  monthlySalaryInr: string;
  city: string;
  address: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DashboardNavComponent],
  template: `
    <app-dashboard-nav></app-dashboard-nav>

    <main class="pt-20 md:pt-28 pb-32 md:pb-16 md:pl-[300px] min-h-screen bg-surface-2">
      <div class="container max-w-4xl py-6">
        <div class="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-border bg-surface-2 flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-primary">Profile Details</h1>
              <p class="text-sm text-secondary">Your account details from signup.</p>
            </div>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm bg-primary/10 border border-primary/20 text-primary">
              User Account
            </span>
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
              <span class="block text-secondary mb-1">Marital Status</span>
              <span class="font-medium text-primary">{{ profile()!.maritalStatus }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">What You Do</span>
              <span class="font-medium text-primary">{{ profile()!.occupation }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">Monthly Salary (INR)</span>
              <span class="font-medium text-primary">{{ profile()!.monthlySalaryInr }}</span>
            </div>
            <div>
              <span class="block text-secondary mb-1">City</span>
              <span class="font-medium text-primary">{{ profile()!.city }}</span>
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
  profile = signal<UserProfileView | null>(null);

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserSignal();
    if (!currentUser) {
      return;
    }

    this.authService.getBackendUserProfile().subscribe({
      next: (backend: any) => {
        this.profile.set({
          fullName: [backend?.first_name, backend?.last_name].filter(Boolean).join(' ').trim() || currentUser.fullName || '-',
          email: backend?.email || currentUser.email || '-',
          mobile: backend?.mobile_number || currentUser.mobile || '-',
          maritalStatus: backend?.marital_status || '-',
          occupation: backend?.what_you_do || '-',
          monthlySalaryInr: backend?.monthly_salary || '-',
          city: backend?.city || '-',
          address: backend?.full_address || '-'
        });
      },
      error: () => {
        this.profile.set({
          fullName: currentUser.fullName || '-',
          email: currentUser.email || '-',
          mobile: currentUser.mobile || '-',
          maritalStatus: '-',
          occupation: '-',
          monthlySalaryInr: '-',
          city: '-',
          address: '-'
        });
      }
    });
  }
}
