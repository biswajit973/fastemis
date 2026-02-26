import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <section class="min-h-screen bg-surface-2 px-3 sm:px-4 pt-20 pb-10 sm:pb-14">
      <div class="max-w-3xl mx-auto rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <p class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wide mb-4">
          Create Account
        </p>
        <h1 class="text-3xl sm:text-4xl font-display font-bold text-primary mb-2">Sign up</h1>
        <p class="text-secondary mb-6">Create your FastEMIs account and continue to dashboard.</p>

        <form [formGroup]="signUpForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-primary mb-1.5">First Name</label>
            <input id="firstName" type="text" formControlName="firstName" placeholder="First name"
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
            @if (showError('firstName')) {
              <p class="mt-1 text-xs text-error">First name is required.</p>
            }
          </div>

          <div>
            <label for="lastName" class="block text-sm font-medium text-primary mb-1.5">Last Name</label>
            <input id="lastName" type="text" formControlName="lastName" placeholder="Last name"
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>

          <div class="sm:col-span-2">
            <label for="email" class="block text-sm font-medium text-primary mb-1.5">Email ID</label>
            <input id="email" type="email" formControlName="email" placeholder="you@example.com"
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
            @if (showError('email')) {
              <p class="mt-1 text-xs text-error">{{ getEmailError() }}</p>
            }
          </div>

          <div>
            <label for="mobileNumber" class="block text-sm font-medium text-primary mb-1.5">Mobile Number</label>
            <input id="mobileNumber" type="tel" formControlName="mobileNumber" placeholder="10 digit mobile number"
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>

          <div>
            <label for="maritalStatus" class="block text-sm font-medium text-primary mb-1.5">Marital Status</label>
            <select id="maritalStatus" formControlName="maritalStatus"
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
              <option value="">Select status</option>
              <option value="unmarried">Unmarried</option>
              <option value="married">Married</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label for="occupationDetails" class="block text-sm font-medium text-primary mb-1.5">What You Do</label>
            <textarea id="occupationDetails" rows="3" formControlName="occupationDetails" placeholder="I am a student / I work in a bank / hotel / school."
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none resize-none focus:ring-2 focus:ring-accent/30 focus:border-accent"></textarea>
          </div>

          <div>
            <label for="monthlySalaryInr" class="block text-sm font-medium text-primary mb-1.5">Monthly Salary (INR)</label>
            <input id="monthlySalaryInr" type="number" formControlName="monthlySalaryInr" placeholder="50000"
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-primary mb-1.5">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="Minimum 4 characters"
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
            @if (showError('password')) {
              <p class="mt-1 text-xs text-error">Password must be at least 4 characters.</p>
            }
          </div>

          <div class="sm:col-span-2">
            <label for="confirmPassword" class="block text-sm font-medium text-primary mb-1.5">Confirm Password</label>
            <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Retype password"
              class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
            @if (passwordMismatch()) {
              <p class="mt-1 text-xs text-error">Passwords do not match.</p>
            }
          </div>

          @if (errorMessage()) {
            <div class="sm:col-span-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {{ errorMessage() }}
            </div>
          }

          <div class="sm:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <button type="submit" [disabled]="submitting()"
              class="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-60">
              {{ submitting() ? 'Creating Account...' : 'Create Account' }}
            </button>
            <a routerLink="/sign-in" class="px-5 py-2.5 rounded-xl border border-border text-primary no-underline hover:bg-surface-2">
              User Sign In
            </a>
            <a routerLink="/agent-sign-in" class="px-5 py-2.5 rounded-xl border border-border text-primary no-underline hover:bg-surface-2">
              Agent Login
            </a>
          </div>
        </form>
      </div>
    </section>
  `
})
export class SignUpComponent {
  submitting = signal(false);
  errorMessage = signal('');

  signUpForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.signUpForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: [''],
      maritalStatus: [''],
      occupationDetails: [''],
      monthlySalaryInr: [''],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.signUpForm.markAllAsTouched();
    if (this.signUpForm.invalid || this.passwordMismatch()) {
      return;
    }

    const value = this.signUpForm.value;
    this.submitting.set(true);
    this.authService.signupUserViaBackend({
      firstName: (value.firstName || '').trim(),
      lastName: (value.lastName || '').trim(),
      email: (value.email || '').trim(),
      mobileNumber: (value.mobileNumber || '').trim(),
      maritalStatus: value.maritalStatus || undefined,
      occupationDetails: (value.occupationDetails || '').trim(),
      monthlySalaryInr: value.monthlySalaryInr,
      password: (value.password || '').trim()
    }).subscribe(result => {
      this.submitting.set(false);
      if (!result.success) {
        this.errorMessage.set(result.message || 'Could not create account. Please try again.');
        return;
      }

      this.notificationService.success('Account created. Sign in successful.');
      const currentUser = this.authService.currentUserSignal();
      if (currentUser?.profileComplete === true) {
        void this.router.navigate(['/dashboard']);
        return;
      }

      void this.router.navigate(['/dashboard/complete-profile']);
    });
  }

  showError(controlName: string): boolean {
    const control = this.signUpForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  passwordMismatch(): boolean {
    const password = this.signUpForm.get('password')?.value || '';
    const confirmPassword = this.signUpForm.get('confirmPassword')?.value || '';
    if (!confirmPassword) {
      return false;
    }
    return password !== confirmPassword;
  }

  getEmailError(): string {
    const control = this.signUpForm.get('email');
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Email id is required.';
    if (control.errors['email']) return 'Please enter a valid email id.';
    return 'Please enter a valid email id.';
  }
}
