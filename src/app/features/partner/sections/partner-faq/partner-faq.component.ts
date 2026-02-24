import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Partner } from '../../../../core/models/partner.model';

@Component({
  selector: 'app-partner-faq',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-16 md:py-24 bg-surface border-t border-border">
      <div class="container max-w-3xl">
        <h2 class="text-3xl md:text-4xl text-center text-primary mb-10">Questions about {{ partner?.name }}?</h2>
        
        <div class="space-y-4">
          <div *ngFor="let item of getFaqs(); let i = index" 
               class="bg-surface-2 rounded-lg border border-border overflow-hidden transition-standard">
            
            <button 
              class="w-full flex items-center justify-between p-5 text-left focus:outline-none"
              (click)="toggle(i)">
              <span class="font-bold text-primary pr-4">{{ item.q }}</span>
              <span class="text-primary transition-standard" [class.rotate-180]="openIndex() === i">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </span>
            </button>
            
            <div 
              class="overflow-hidden transition-all duration-300"
              [style.max-height]="openIndex() === i ? '500px' : '0'">
              <p class="p-5 pt-0 text-secondary text-sm leading-relaxed border-t border-border mt-1">
                {{ item.a }}
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  `
})
export class PartnerFaqComponent {
  @Input() partner: Partner | null = null;
  openIndex = signal<number | null>(0);

  getFaqs() {
    return [
      {
        q: `What is the processing fee for ${this.partner?.name}?`,
        a: `The processing fee is strictly ${this.partner?.processing_fee}%. There are no hidden charges. GST is applicable on the processing fee as per government norms.`
      },
      {
        q: 'What documents are required for approval?',
        a: 'We require a scanned copy of your Tax ID, National ID for KYC verification, and your last 3 months bank statement to verify your EMI repayment capacity.'
      },
      {
        q: `How long does ${this.partner?.name} take to disburse the funds?`,
        a: 'Once your application is submitted, initial verification takes ~24 hours. The entire BGV (Background Verification) process limits at 72 hours. Funds are disbursed on the same day BGV concludes successfully.'
      },
      {
        q: 'What happens if I miss an EMI?',
        a: 'Missing an EMI will incur a late payment penalty. Continued failure to pay may be reported to CIBIL and other credit bureaus, which can affect your future financing eligibility.'
      }
    ];
  }

  toggle(index: number) {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }
}
