import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-agent-sign-in',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <section class="min-h-screen pt-14 bg-[#f4f6fb] text-primary px-3 pb-6">
      <div class="mx-auto w-full max-w-md pt-4">
        <div class="rounded-[2.2rem] border border-[#dce3ef] bg-[#f7f9fd] px-5 py-6 shadow-[20px_20px_45px_rgba(15,38,75,0.12),_-10px_-10px_28px_rgba(255,255,255,0.95)]">
          <div class="mx-auto mb-5 h-1.5 w-20 rounded-full bg-[#cfd8e8]"></div>

          <p class="text-center text-[11px] uppercase tracking-[0.15em] text-secondary">Vendor Agent Login</p>
          <h1 class="mt-2 text-center text-3xl font-semibold text-primary">Enter Passcode</h1>
          <p class="mt-1 text-center text-sm text-secondary">Logged in as Agent</p>

          <div class="mt-6 flex items-center justify-center gap-3">
            <span *ngFor="let idx of [0,1,2,3,4,5]"
              class="h-3.5 w-3.5 rounded-full border border-[#a7b6cf] transition-all"
              [class.bg-primary]="passcode().length > idx"
              [class.bg-transparent]="passcode().length <= idx">
            </span>
          </div>

          <input
            #passcodeInput
            type="password"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            [value]="passcode()"
            (input)="onInputChange($event)"
            class="mt-5 w-full rounded-xl border border-[#cdd8ea] bg-[#f3f6fb] px-3 py-3 text-center tracking-[0.4em] text-lg outline-none shadow-[inset_4px_4px_10px_rgba(15,38,75,0.08),_inset_-4px_-4px_10px_rgba(255,255,255,0.95)]"
            placeholder="••••••" />

          <p *ngIf="errorMessage()" class="mt-4 rounded-xl border border-red-300/70 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ errorMessage() }}
          </p>

          <div class="mt-6 grid grid-cols-3 gap-3">
            <button *ngFor="let key of keypad" type="button" (click)="onKeyPress(key)"
              class="h-14 rounded-full border border-[#d0dbee] bg-[#eef3fb] text-2xl font-medium text-primary active:scale-[0.98] transition shadow-[6px_6px_14px_rgba(15,38,75,0.12),_-4px_-4px_10px_rgba(255,255,255,0.95)]">
              {{ key }}
            </button>
            <button type="button" (click)="onClear()"
              class="h-14 rounded-full border border-[#d0dbee] bg-[#eef3fb] text-sm font-semibold text-secondary active:scale-[0.98] transition shadow-[6px_6px_14px_rgba(15,38,75,0.12),_-4px_-4px_10px_rgba(255,255,255,0.95)]">
              Clear
            </button>
            <button type="button" (click)="onKeyPress('0')"
              class="h-14 rounded-full border border-[#d0dbee] bg-[#eef3fb] text-2xl font-medium text-primary active:scale-[0.98] transition shadow-[6px_6px_14px_rgba(15,38,75,0.12),_-4px_-4px_10px_rgba(255,255,255,0.95)]">
              0
            </button>
            <button type="button" (click)="onBackspace()"
              class="h-14 rounded-full border border-[#d0dbee] bg-[#eef3fb] text-sm font-semibold text-secondary active:scale-[0.98] transition shadow-[6px_6px_14px_rgba(15,38,75,0.12),_-4px_-4px_10px_rgba(255,255,255,0.95)]">
              Del
            </button>
          </div>

          <button type="button" (click)="submit()" [disabled]="submitting() || passcode().length !== 6"
            class="mt-4 w-full rounded-xl bg-primary text-white py-3 font-semibold disabled:opacity-55 shadow-[10px_10px_20px_rgba(15,38,75,0.18)]">
            {{ submitting() ? 'Verifying...' : 'Unlock Agent Panel' }}
          </button>

          <a routerLink="/sign-in" class="mt-4 block text-center text-sm text-secondary no-underline hover:text-primary">
            Use User Login
          </a>
        </div>
      </div>
    </section>
  `
})
export class AgentSignInComponent implements OnInit, AfterViewInit {
  @ViewChild('passcodeInput') private passcodeInput?: ElementRef<HTMLInputElement>;

  passcode = signal('');
  submitting = signal(false);
  errorMessage = signal('');
  redirectUrl = signal('');

  readonly keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const requestedRedirect = this.route.snapshot.queryParamMap.get('redirect');
    this.redirectUrl.set(requestedRedirect || '');
  }

  ngAfterViewInit(): void {
    this.focusPasscodeInput();
  }

  onKeyPress(digit: string): void {
    if (this.passcode().length >= 6) {
      return;
    }
    if (!/^\d$/.test(digit)) {
      return;
    }
    this.passcode.set(`${this.passcode()}${digit}`);
    this.errorMessage.set('');
    this.focusPasscodeInput();
    this.tryAutoSubmit();
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = String(input.value || '');
    const numeric = raw.replace(/\D/g, '').slice(0, 6);
    this.passcode.set(numeric);
    this.errorMessage.set('');
    this.tryAutoSubmit();
  }

  onBackspace(): void {
    this.errorMessage.set('');
    this.passcode.set(this.passcode().slice(0, -1));
    this.focusPasscodeInput();
  }

  onClear(): void {
    this.errorMessage.set('');
    this.passcode.set('');
    this.focusPasscodeInput();
  }

  submit(): void {
    if (this.submitting() || this.passcode().length !== 6) {
      return;
    }

    this.submitting.set(true);
    this.authService.loginAgentViaBackend(this.passcode()).subscribe(result => {
      this.submitting.set(false);
      if (!result.success) {
        this.errorMessage.set(result.message || 'Could not sign in. Please try again.');
        this.passcode.set('');
        this.focusPasscodeInput();
        return;
      }

      this.notificationService.success('Agent sign in successful.');
      const redirect = this.redirectUrl();
      if (redirect.startsWith('/agent')) {
        void this.router.navigateByUrl(redirect);
        return;
      }
      void this.router.navigate(['/agent']);
    });
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (this.submitting()) {
      return;
    }

    const key = event.key;
    if (/^\d$/.test(key)) {
      event.preventDefault();
      this.onKeyPress(key);
      return;
    }

    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      this.onBackspace();
      return;
    }

    if (key === 'Enter') {
      event.preventDefault();
      this.submit();
    }
  }

  private tryAutoSubmit(): void {
    if (this.passcode().length === 6) {
      this.submit();
    }
  }

  private focusPasscodeInput(): void {
    const input = this.passcodeInput?.nativeElement;
    if (!input) return;
    queueMicrotask(() => input.focus());
  }
}
