import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application } from '../../../../core/models/application.model';
import { CurrencyGlobalPipe } from '../../../../shared/pipes/custom.pipes';

@Component({
  selector: 'app-dashboard-completion',
  standalone: true,
  imports: [CommonModule, CurrencyGlobalPipe],
  template: `
    <div class="bg-surface rounded-2xl border border-border shadow-lg mb-6 overflow-hidden">
      <!-- Confetti / Success Header -->
      <div class="bg-success/10 p-8 text-center border-b border-border">
        <div class="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center mx-auto mb-4 shadow-md scale-in delay-100">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 class="text-2xl font-display font-bold text-primary mb-2 slide-up delay-200">Funds Disbursed!</h2>
        <p class="text-secondary text-sm slide-up delay-300">
          The requested amount of <span class="font-bold">{{ application?.requestedAmount | currencyGlobal }}</span> has been transferred.
        </p>
      </div>
      
      <div class="p-6">
        <h3 class="font-bold text-primary mb-4">EMI Plan Details</h3>
        
        <div class="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 pb-6 border-b border-border">
          <div>
            <span class="text-xs text-muted block mb-1">Application ID</span>
            <span class="text-sm font-medium font-mono text-primary">{{ application?.id }}</span>
          </div>
          <div>
            <span class="text-xs text-muted block mb-1">Partner Name</span>
            <span class="text-sm font-medium text-primary">{{ partnerName }}</span>
          </div>
          <div>
            <span class="text-xs text-muted block mb-1">Total Purchase Amount</span>
            <span class="text-sm font-medium text-primary">{{ application?.requestedAmount | currencyGlobal }}</span>
          </div>
          <div>
            <span class="text-xs text-muted block mb-1">Interest Rate</span>
            <span class="text-sm font-medium text-primary">14.5% p.a</span>
          </div>
          <div>
            <span class="text-xs text-muted block mb-1">Tenure</span>
            <span class="text-sm font-medium text-primary">12 Months</span>
          </div>
          <div>
            <span class="text-xs text-muted block mb-1">Monthly EMI</span>
            <span class="text-sm font-medium text-primary">{{ (application?.requestedAmount || 0) / 11 | currencyGlobal }}</span>
          </div>
        </div>

        <h3 class="font-bold text-primary mb-4">Repayment Schedule</h3>
        <div class="space-y-3">
          <!-- Mock schedule rows -->
          <div class="flex justify-between items-center p-3 rounded-lg bg-surface-2 border border-border">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-secondary">1</div>
              <div>
                <div class="text-sm font-medium text-primary">{{ upcomingDate(1) }}</div>
                <div class="text-xs text-muted">Auto-debit from HDFC</div>
              </div>
            </div>
            <div class="text-sm font-bold text-primary">{{ (application?.requestedAmount || 0) / 11 | currencyGlobal }}</div>
          </div>

          <div class="flex justify-between items-center p-3 rounded-lg bg-surface-2 border border-border">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-secondary">2</div>
              <div>
                <div class="text-sm font-medium text-primary">{{ upcomingDate(2) }}</div>
                <div class="text-xs text-muted">Auto-debit from HDFC</div>
              </div>
            </div>
            <div class="text-sm font-bold text-primary">{{ (application?.requestedAmount || 0) / 11 | currencyGlobal }}</div>
          </div>

          <div class="text-center py-2">
            <button class="text-sm font-medium text-primary hover:text-primary-light transition-standard">View Full Schedule &rarr;</button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class DashboardCompletionComponent {
  @Input() application: Application | null = null;
  @Input() partnerName: string = '';

  upcomingDate(monthsFromNow: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsFromNow);
    d.setDate(5); // Typical EMI date
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
