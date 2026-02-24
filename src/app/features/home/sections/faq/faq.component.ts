import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home-faq',
    standalone: true,
    imports: [CommonModule],
    template: `
    <section class="py-16 md:py-24 bg-surface-2 border-t border-border">
      <div class="container max-w-3xl">
        <h2 class="text-3xl md:text-4xl text-center text-primary mb-10">Frequently Asked Questions</h2>
        
        <div class="space-y-4">
          <div *ngFor="let item of faqs; let i = index" 
               class="bg-surface rounded-lg border border-border overflow-hidden transition-standard">
            
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
export class HomeFaqComponent {
    openIndex = signal<number | null>(0); // First open by default

    faqs = [
        {
            q: 'Is FastEMIs a direct financer?',
            a: 'No. FastEMIs is an EMI marketplace platform that connects you with verified finance partners. FastEMIs does not provide direct funding.'
        },
        {
            q: 'Is my Aadhaar and PAN data safe?',
            a: 'Your documents are encrypted using 256-bit SSL and stored on secure servers. We follow RBI data protection guidelines.'
        },
        {
            q: 'What is the minimum EMI amount?',
            a: 'The minimum finance amount through our platform is ₹30,000.'
        },
        {
            q: 'How long does approval take?',
            a: 'Document verification typically takes 3–24 hours. BGV completion takes a minimum of 72 hours.'
        },
        {
            q: 'Can I apply from outside India?',
            a: 'Our services are currently available for Indian residents only, with a valid Indian PAN and Aadhaar.'
        },
        {
            q: 'What happens after BGV is complete?',
            a: 'Your finance partner disburses the coin amount directly. You will receive confirmation on your registered contact.'
        },
        {
            q: 'Are there hidden charges?',
            a: 'All fees are clearly displayed on each partner\'s page before you apply. What you see is exactly what you pay.'
        },
        {
            q: 'Can I prepay my EMI?',
            a: 'Prepayment terms vary by partner. Check your chosen partner\'s terms and conditions page for details.'
        }
    ];

    toggle(index: number) {
        this.openIndex.set(this.openIndex() === index ? null : index);
    }
}
