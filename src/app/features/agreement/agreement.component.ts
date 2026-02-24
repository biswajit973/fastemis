import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApplicationService } from '../../core/services/application.service';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ScreenshotBlockDirective } from '../../shared/directives/screenshot-block.directive';

interface Question {
    id: number;
    question: string;
}

@Component({
    selector: 'app-agreement',
    standalone: true,
    imports: [CommonModule, ButtonComponent, ScreenshotBlockDirective],
    // Add the anti-screenshot directive to the host element
    hostDirectives: [ScreenshotBlockDirective],
    template: `
    <div class="min-h-screen bg-surface flex flex-col no-scroll">
      
      <!-- Sticky Header -->
      <header class="bg-primary text-white p-4 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div class="flex items-center gap-3">
          <button (click)="goBack()" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-standard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <span class="font-bold">EMI Plan Agreement & Mandate</span>
        </div>
        <div class="text-xs font-bold bg-white/20 px-2 py-1 rounded">SECURE</div>
      </header>

      <!-- Security Warning -->
      <div class="bg-surface-3 p-3 flex items-start gap-3 border-b border-border">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-primary shrink-0 mt-0.5" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <p class="text-xs text-secondary leading-tight">For security, screenshots and screen recording are disabled on this page. Do not share this screen with anyone.</p>
      </div>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-6 md:p-8 max-w-3xl mx-auto w-full pb-32">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-primary mb-2">Digital Signature required</h1>
          <p class="text-sm text-secondary">Please read and acknowledge each condition to proceed with the EMI plan agreement.</p>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-12">
          <div class="w-10 h-10 border-4 border-surface-3 border-t-primary rounded-full animate-spin"></div>
        </div>

        <div *ngIf="!loading()" class="space-y-4">
          <div *ngFor="let q of questions(); let i = index" 
               class="p-4 rounded-xl border transition-standard flex items-start gap-4 cursor-pointer hover:bg-surface-2"
               [ngClass]="answers().has(q.id) ? 'border-primary bg-primary-light/5' : 'border-border bg-surface'"
               (click)="toggleAnswer(q.id, i)">
               
            <div class="mt-0.5">
              <div class="w-6 h-6 rounded border flex items-center justify-center transition-standard"
                   [ngClass]="answers().has(q.id) ? 'bg-primary border-primary text-white' : 'border-border-strong bg-surface'">
                <svg *ngIf="answers().has(q.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" class="scale-in" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </div>
            
            <div class="flex-1">
              <p class="text-sm md:text-base font-medium text-primary select-none cursor-pointer">{{ q.question }}</p>
            </div>
            
          </div>
        </div>
      </main>

      <!-- Footer CTA (Sticky) -->
      <footer class="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)] z-40">
        <div class="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div class="flex-1">
            <div class="w-full bg-surface-3 h-2 rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-300" [style.width]="progressPercentage() + '%'"></div>
            </div>
            <p class="text-xs text-secondary font-medium mt-1">{{ answers().size }} of {{ questions().length }} completed</p>
          </div>
          
          <app-button 
            variant="primary" 
            [disabled]="!isComplete() || submitting()"
            (onClick)="submitAgreement()">
            {{ submitting() ? 'Signing...' : 'Sign & Complete' }}
          </app-button>
        </div>
      </footer>
    </div>
  `
})
export class AgreementComponent implements OnInit, OnDestroy {
    questions = signal<Question[]>([]);
    answers = signal<Set<number>>(new Set());

    loading = signal<boolean>(true);
    submitting = signal<boolean>(false);

    constructor(
        private http: HttpClient,
        private router: Router,
        private appService: ApplicationService,
        private notification: NotificationService
    ) { }

    ngOnInit() {
        this.http.get<Question[]>('/assets/data/tnc-questions.json').subscribe({
            next: (data) => {
                this.questions.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.notification.error('Failed to load agreement data');
                this.goBack();
            }
        });

        // Enforce lock mode
        document.body.classList.add('no-scroll');
    }

    toggleAnswer(id: number, index: number) {
        const nextAnswers = new Set(this.answers());
        if (nextAnswers.has(id)) {
            nextAnswers.delete(id);
        } else {
            nextAnswers.add(id);

            // Auto scroll slightly
            const elements = document.querySelectorAll('.rounded-xl');
            if (elements && elements[index + 1]) {
                elements[index + 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        this.answers.set(nextAnswers);
    }

    isComplete(): boolean {
        return this.questions().length > 0 && this.answers().size === this.questions().length;
    }

    progressPercentage(): number {
        if (this.questions().length === 0) return 0;
        return (this.answers().size / this.questions().length) * 100;
    }

    submitAgreement() {
        if (this.isComplete()) {
            this.submitting.set(true);

            // Simulate cryptographic digital signature delay
            setTimeout(() => {
                this.appService.progressApplicationState(); // Move to PAYMENT_PENDING
                this.submitting.set(false);
                this.notification.success('Digital Signature Applied Successfully');
                this.router.navigate(['/dashboard']);
            }, 1500);
        }
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }

    ngOnDestroy() {
        document.body.classList.remove('no-scroll');
    }
}
