import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthRole, AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="min-h-screen bg-surface-2 px-4 py-10 sm:py-14">
      <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        <div class="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <p class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wide mb-4">
            FastEMIs Access
          </p>
          <h1 class="text-3xl sm:text-4xl font-display font-bold text-primary mb-3">Sign in to continue</h1>
          <p class="text-secondary leading-relaxed mb-6">
            Choose your role, enter email id and password, and continue to your panel.
          </p>

          <div class="space-y-3 text-sm">
            <div class="rounded-xl border border-border bg-surface-2 p-3">
              <p class="text-xs text-muted uppercase tracking-wide mb-1">User Demo</p>
              <p class="font-medium text-primary">Email: samantha.jane&#64;example.com</p>
              <p class="font-medium text-primary">Password: user&#64;1234</p>
            </div>
            <div class="rounded-xl border border-border bg-surface-2 p-3">
              <p class="text-xs text-muted uppercase tracking-wide mb-1">Agent Demo</p>
              <p class="font-medium text-primary">Email: agent&#64;acme.com</p>
              <p class="font-medium text-primary">Password: agent&#64;1234</p>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <a routerLink="/" class="text-sm px-4 py-2 rounded-lg border border-border text-primary no-underline hover:bg-surface-2 transition-colors">
              Back to Home
            </a>
            <a routerLink="/tester" class="text-sm px-4 py-2 rounded-lg bg-primary text-white no-underline hover:opacity-95 transition-opacity">
              Bypass via Tester
            </a>
          </div>
        </div>

        <div class="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
          <div class="inline-flex w-full rounded-xl border border-border bg-surface-2 p-1 mb-6">
            <button
              type="button"
              (click)="switchRole('user')"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              [class.bg-surface]="role() === 'user'"
              [class.text-primary]="role() === 'user'"
              [class.text-secondary]="role() !== 'user'">
              Sign in as User
            </button>
            <button
              type="button"
              (click)="switchRole('vendor')"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              [class.bg-surface]="role() === 'vendor'"
              [class.text-primary]="role() === 'vendor'"
              [class.text-secondary]="role() !== 'vendor'">
              Sign in as Agent
            </button>
          </div>

          <form [formGroup]="signInForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-primary mb-1.5">Email ID</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="Enter email id" />
              @if (showError('email')) {
                <p class="mt-1 text-xs text-error">{{ getEmailError() }}</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-primary mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="Enter password" />
              @if (showError('password')) {
                <p class="mt-1 text-xs text-error">{{ getPasswordError() }}</p>
              }
            </div>

            @if (errorMessage()) {
              <div class="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {{ errorMessage() }}
              </div>
            }

            <button
              type="submit"
              [disabled]="submitting()"
              class="w-full rounded-xl bg-primary text-white py-2.5 font-semibold transition-opacity disabled:opacity-60">
              {{ submitting() ? 'Signing In...' : (role() === 'user' ? 'Sign In as User' : 'Sign In as Agent') }}
            </button>

            <button
              type="button"
              (click)="applyDemoCredentials()"
              class="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-primary hover:bg-surface-2 transition-colors">
              Use Demo Credentials
            </button>
          </form>
        </div>
      </div>
    </section>
  `
})
export class SignInComponent implements OnInit {
  role = signal<AuthRole>('user');
  submitting = signal(false);
  errorMessage = signal('');

  signInForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.signInForm = this.fb.group({
      email: ['samantha.jane@example.com', [Validators.required, Validators.email]],
      password: ['user@1234', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit(): void {
    const requestedRole = this.route.snapshot.queryParamMap.get('role');
    if (requestedRole === 'vendor') {
      this.switchRole('vendor');
      return;
    }

    if (requestedRole === 'user') {
      this.switchRole('user');
    }
  }

  switchRole(role: AuthRole): void {
    this.role.set(role);
    this.errorMessage.set('');
    this.signInForm.reset({
      email: role === 'user' ? 'samantha.jane@example.com' : 'agent@acme.com',
      password: role === 'user' ? 'user@1234' : 'agent@1234'
    });
  }

  applyDemoCredentials(): void {
    this.signInForm.patchValue({
      email: this.role() === 'user' ? 'samantha.jane@example.com' : 'agent@acme.com',
      password: this.role() === 'user' ? 'user@1234' : 'agent@1234'
    });
    this.signInForm.markAsDirty();
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.signInForm.markAllAsTouched();
    if (this.signInForm.invalid) {
      return;
    }

    const email = (this.signInForm.value.email || '').trim();
    const password = (this.signInForm.value.password || '').trim();

    this.submitting.set(true);
    setTimeout(() => {
      const result = this.authService.loginWithCredentials(this.role(), email, password);
      this.submitting.set(false);

      if (!result.success) {
        this.errorMessage.set(result.message || 'Could not sign in. Please try again.');
        return;
      }

      void this.router.navigate([this.role() === 'user' ? '/dashboard' : '/agent']);
    }, 250);
  }

  showError(controlName: 'email' | 'password'): boolean {
    const control = this.signInForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getEmailError(): string {
    const control = this.signInForm.get('email');
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Email id is required.';
    return 'Please enter a valid email id.';
  }

  getPasswordError(): string {
    const control = this.signInForm.get('password');
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Password is required.';
    return 'Password must be at least 4 characters.';
  }
}
