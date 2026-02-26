import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <section class="min-h-screen bg-surface-2 pt-20 pb-10 px-3 sm:px-4">
      <div class="mx-auto max-w-md">
        <div class="rounded-3xl border border-border bg-surface shadow-sm p-5 sm:p-6">
          <p class="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
            User Access
          </p>

          <h1 class="mt-3 text-2xl sm:text-3xl font-bold text-primary">Sign in to your account</h1>
          <p class="mt-1 text-sm text-secondary">Use your email and password to continue.</p>

          <form [formGroup]="signInForm" (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
            <div>
              <label for="identifier" class="block text-sm font-medium text-primary mb-1.5">Email ID</label>
              <input
                id="identifier"
                type="email"
                formControlName="identifier"
                class="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="you@example.com" />
              @if (showError('identifier')) {
                <p class="mt-1 text-xs text-error">{{ getIdentifierError() }}</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-primary mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="Enter password" />
              @if (showError('password')) {
                <p class="mt-1 text-xs text-error">{{ getPasswordError() }}</p>
              }
            </div>

            <label class="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" formControlName="rememberMe" class="h-4 w-4 rounded border-border text-primary focus:ring-accent/40" />
              <span class="text-sm text-secondary">Remember me on this device</span>
            </label>

            @if (errorMessage()) {
              <div class="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {{ errorMessage() }}
              </div>
            }

            <button
              type="submit"
              [disabled]="submitting()"
              class="w-full rounded-xl bg-primary text-white py-3 font-semibold disabled:opacity-60">
              {{ submitting() ? 'Signing In...' : 'Sign In as User' }}
            </button>
          </form>

          <div class="mt-5 grid grid-cols-1 gap-2">
            <a routerLink="/sign-up"
              class="text-center rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-primary no-underline hover:bg-surface-2">
              Create New Account
            </a>
            <a routerLink="/agent-sign-in"
              class="text-center rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-primary no-underline hover:bg-surface-2">
              Agent Login
            </a>
          </div>
        </div>
      </div>
    </section>
  `
})
export class SignInComponent implements OnInit {
  submitting = signal(false);
  errorMessage = signal('');
  redirectUrl = signal<string>('');

  signInForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.signInForm = this.fb.group({
      identifier: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [true]
    });
  }

  ngOnInit(): void {
    const requestedRedirect = this.route.snapshot.queryParamMap.get('redirect');
    this.redirectUrl.set(requestedRedirect || '');
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.signInForm.markAllAsTouched();
    if (this.signInForm.invalid) {
      return;
    }

    const identifier = (this.signInForm.value.identifier || '').trim();
    const password = (this.signInForm.value.password || '').trim();
    const rememberMe = !!this.signInForm.value.rememberMe;

    this.submitting.set(true);
    this.authService.loginUserViaBackend(identifier, password, rememberMe).subscribe(result => {
      this.submitting.set(false);
      if (!result.success) {
        this.errorMessage.set(result.message || 'Could not sign in. Please try again.');
        return;
      }

      this.notificationService.success('Sign in successful.');
      const currentUser = this.authService.currentUserSignal();
      const isProfileComplete = currentUser?.profileComplete === true;
      const redirect = this.redirectUrl();

      if (!isProfileComplete) {
        const queryParams = redirect.startsWith('/dashboard') && !redirect.startsWith('/dashboard/complete-profile')
          ? { redirect }
          : {};
        void this.router.navigate(['/dashboard/complete-profile'], { queryParams });
        return;
      }

      if (redirect.startsWith('/dashboard')) {
        void this.router.navigateByUrl(redirect);
        return;
      }
      void this.router.navigate(['/dashboard']);
    });
  }

  showError(controlName: 'identifier' | 'password'): boolean {
    const control = this.signInForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getIdentifierError(): string {
    const control = this.signInForm.get('identifier');
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Email id is required.';
    if (control.errors['email']) return 'Please enter a valid email id.';
    return 'Please enter a valid email id.';
  }

  getPasswordError(): string {
    const control = this.signInForm.get('password');
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Password is required.';
    return 'Password must be at least 4 characters.';
  }
}
