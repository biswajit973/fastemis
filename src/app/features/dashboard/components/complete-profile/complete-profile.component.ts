import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService, BackendUserProfileResponse } from '../../../../core/services/auth.service';
import { DashboardNavComponent } from '../dashboard-nav/dashboard-nav.component';
import { UploadZoneComponent } from '../../../../shared/components/upload-zone/upload-zone.component';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardNavComponent, UploadZoneComponent],
  template: `
    <app-dashboard-nav></app-dashboard-nav>

    <main class="pt-20 md:pt-28 pb-32 md:pb-16 md:pl-[300px] min-h-screen bg-surface-2">
      <div class="container max-w-4xl py-6">
        <div *ngIf="loading()" class="rounded-2xl border border-border bg-surface p-8 flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-surface-3 border-t-primary rounded-full animate-spin"></div>
        </div>

        <ng-container *ngIf="!loading()">
          <section class="sticky top-20 z-20 mb-4 rounded-xl border border-warning/40 bg-warning/10 p-4 animate-soft-pulse">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="font-semibold text-warning">Profile incomplete</h2>
                <p class="text-sm text-warning/90">
                  {{ missingFields().length }} field{{ missingFields().length === 1 ? '' : 's' }} remaining
                </p>
              </div>
              <div class="text-xs font-semibold px-2.5 py-1 rounded-full border border-warning/40 bg-warning/15 text-warning">
                {{ progress() }}% Complete
              </div>
            </div>
          </section>

          <section class="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
            <h1 class="text-2xl font-bold text-primary mb-1">Complete Your Profile</h1>
            <p class="text-sm text-secondary mb-6">
              Fill all required details to continue using your dashboard features.
            </p>

            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  formControlName="mobile_number"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="10 to 15 digits" />
                <p *ngIf="fieldError('mobile_number')" class="mt-1 text-xs text-error">{{ fieldError('mobile_number') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">Marital Status</label>
                <select
                  formControlName="marital_status"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
                  <option value="">Select status</option>
                  <option value="married">Married</option>
                  <option value="unmarried">Unmarried</option>
                </select>
                <p *ngIf="fieldError('marital_status')" class="mt-1 text-xs text-error">{{ fieldError('marital_status') }}</p>
              </div>

              <div class="md:col-span-2" *ngIf="profileForm.get('marital_status')?.value === 'married'">
                <label class="block text-sm font-medium text-primary mb-1.5">Spouse Occupation</label>
                <textarea
                  rows="2"
                  formControlName="spouse_occupation"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none resize-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="Example: She is a teacher."></textarea>
                <p *ngIf="fieldError('spouse_occupation')" class="mt-1 text-xs text-error">{{ fieldError('spouse_occupation') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">PIN Code</label>
                <input
                  type="text"
                  formControlName="pincode"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="6 digits" />
                <p *ngIf="fieldError('pincode')" class="mt-1 text-xs text-error">{{ fieldError('pincode') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">City</label>
                <input
                  type="text"
                  formControlName="city"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="City name" />
                <p *ngIf="fieldError('city')" class="mt-1 text-xs text-error">{{ fieldError('city') }}</p>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-primary mb-1.5">Full Address</label>
                <textarea
                  rows="2"
                  formControlName="full_address"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none resize-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="House, street, area"></textarea>
                <p *ngIf="fieldError('full_address')" class="mt-1 text-xs text-error">{{ fieldError('full_address') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">Employment Type</label>
                <select
                  formControlName="employment_type"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
                  <option value="">Select employment type</option>
                  <option value="salaried">Salaried</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="student">Student</option>
                </select>
                <p *ngIf="fieldError('employment_type')" class="mt-1 text-xs text-error">{{ fieldError('employment_type') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">Monthly Salary (INR)</label>
                <input
                  type="number"
                  formControlName="monthly_salary"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="50000" />
                <p *ngIf="fieldError('monthly_salary')" class="mt-1 text-xs text-error">{{ fieldError('monthly_salary') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">Requested Amount (INR)</label>
                <input
                  type="number"
                  formControlName="requested_amount"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="120000" />
                <p *ngIf="fieldError('requested_amount')" class="mt-1 text-xs text-error">{{ fieldError('requested_amount') }}</p>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-primary mb-1.5">What You Do</label>
                <textarea
                  rows="2"
                  formControlName="what_you_do"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none resize-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="I work in a bank / hotel / school"></textarea>
                <p *ngIf="fieldError('what_you_do')" class="mt-1 text-xs text-error">{{ fieldError('what_you_do') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">Aadhar Number</label>
                <input
                  type="text"
                  formControlName="aadhar_number"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="12 digits" />
                <p *ngIf="fieldError('aadhar_number')" class="mt-1 text-xs text-error">{{ fieldError('aadhar_number') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-1.5">PAN Number</label>
                <input
                  type="text"
                  formControlName="pan_number"
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none uppercase focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="ABCDE1234F" />
                <p *ngIf="fieldError('pan_number')" class="mt-1 text-xs text-error">{{ fieldError('pan_number') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-2">Aadhar Proof (Image/Video)</label>
                <app-upload-zone
                  label="Upload Aadhar proof"
                  hint="Image or video file"
                  accept="image/*,video/*"
                  [uploading]="false"
                  [progress]="0"
                  (fileDropped)="onAadharProofSelected($event)">
                </app-upload-zone>
                <p *ngIf="existingAadharFileName()" class="mt-1 text-xs text-secondary">
                  Existing file: {{ existingAadharFileName() }}
                </p>
                <p *ngIf="fileError('aadhar_image')" class="mt-1 text-xs text-error">{{ fileError('aadhar_image') }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-2">PAN Proof (Image/Video)</label>
                <app-upload-zone
                  label="Upload PAN proof"
                  hint="Image or video file"
                  accept="image/*,video/*"
                  [uploading]="false"
                  [progress]="0"
                  (fileDropped)="onPanProofSelected($event)">
                </app-upload-zone>
                <p *ngIf="existingPanFileName()" class="mt-1 text-xs text-secondary">
                  Existing file: {{ existingPanFileName() }}
                </p>
                <p *ngIf="fileError('pancard_image')" class="mt-1 text-xs text-error">{{ fileError('pancard_image') }}</p>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-primary mb-2">Live Photo (Image)</label>
                <app-upload-zone
                  label="Upload live photo"
                  hint="Image only"
                  accept="image/*"
                  [uploading]="false"
                  [progress]="0"
                  (fileDropped)="onLivePhotoSelected($event)">
                </app-upload-zone>
                <p *ngIf="existingLivePhotoName()" class="mt-1 text-xs text-secondary">
                  Existing file: {{ existingLivePhotoName() }}
                </p>
                <p *ngIf="fileError('live_photo')" class="mt-1 text-xs text-error">{{ fileError('live_photo') }}</p>
              </div>

              <div class="md:col-span-2" *ngIf="generalError()">
                <div class="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  {{ generalError() }}
                </div>
              </div>

              <div class="md:col-span-2 pt-1">
                <button
                  type="submit"
                  [disabled]="submitting()"
                  class="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-60">
                  {{ submitting() ? 'Saving...' : 'Save & Continue' }}
                </button>
              </div>
            </form>
          </section>
        </ng-container>
      </div>
    </main>
  `,
  styles: [`
    @keyframes softPulse {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.24); }
      70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }

    .animate-soft-pulse {
      animation: softPulse 2.2s ease-in-out infinite;
    }
  `]
})
export class CompleteProfileComponent implements OnInit, OnDestroy {
  loading = signal(true);
  submitting = signal(false);
  generalError = signal('');
  apiErrors = signal<Record<string, string>>({});
  missingFields = signal<string[]>([]);
  progress = signal(0);
  attemptedSubmit = signal(false);

  existingAadharFileName = signal('');
  existingPanFileName = signal('');
  existingLivePhotoName = signal('');

  selectedAadharProof = signal<File | null>(null);
  selectedPanProof = signal<File | null>(null);
  selectedLivePhoto = signal<File | null>(null);

  profileForm: FormGroup;

  private redirectAfterSave = '/dashboard';
  private valueChangesSub?: Subscription;
  private maritalSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.profileForm = this.fb.group({
      mobile_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      marital_status: ['', [Validators.required]],
      spouse_occupation: [''],
      pincode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
      city: ['', [Validators.required]],
      full_address: ['', [Validators.required, Validators.minLength(3)]],
      employment_type: ['', [Validators.required]],
      what_you_do: ['', [Validators.required, Validators.minLength(3)]],
      monthly_salary: ['', [Validators.required, Validators.min(1)]],
      requested_amount: ['', [Validators.required, Validators.min(1)]],
      aadhar_number: ['', [Validators.required, Validators.pattern(/^[0-9]{12}$/)]],
      pan_number: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/)]]
    });
  }

  ngOnInit(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    if (redirect && redirect.startsWith('/dashboard') && !redirect.startsWith('/dashboard/complete-profile')) {
      this.redirectAfterSave = redirect;
    }

    this.setupSpouseValidation();
    this.loadProfile();

    this.valueChangesSub = this.profileForm.valueChanges.subscribe(() => {
      this.refreshLocalCompletionHint();
    });
  }

  ngOnDestroy(): void {
    this.valueChangesSub?.unsubscribe();
    this.maritalSub?.unsubscribe();
  }

  onAadharProofSelected(file: File): void {
    this.selectedAadharProof.set(file);
    this.apiErrors.update(errors => ({ ...errors, aadhar_image: '' }));
    this.refreshLocalCompletionHint();
  }

  onPanProofSelected(file: File): void {
    this.selectedPanProof.set(file);
    this.apiErrors.update(errors => ({ ...errors, pancard_image: '' }));
    this.refreshLocalCompletionHint();
  }

  onLivePhotoSelected(file: File): void {
    this.selectedLivePhoto.set(file);
    this.apiErrors.update(errors => ({ ...errors, live_photo: '' }));
    this.refreshLocalCompletionHint();
  }

  fieldError(fieldName: string): string {
    const apiError = this.apiErrors()[fieldName];
    if (apiError) {
      return apiError;
    }

    const control = this.profileForm.get(fieldName);
    if (!control) {
      return '';
    }

    const shouldShow = control.invalid && (control.touched || control.dirty || this.attemptedSubmit());
    if (!shouldShow) {
      return '';
    }

    if (control.errors?.['required']) {
      return 'This field is required.';
    }
    if (control.errors?.['pattern']) {
      if (fieldName === 'mobile_number') return 'Enter a valid 10 to 15 digit mobile number.';
      if (fieldName === 'pincode') return 'Enter a valid 6 digit pin code.';
      if (fieldName === 'aadhar_number') return 'Aadhar number must be 12 digits.';
      if (fieldName === 'pan_number') return 'PAN format should be ABCDE1234F.';
    }
    if (control.errors?.['min']) {
      return 'Value must be greater than 0.';
    }
    if (control.errors?.['minlength']) {
      return 'Please enter more details.';
    }

    return 'Invalid value.';
  }

  fileError(fieldName: 'aadhar_image' | 'pancard_image' | 'live_photo'): string {
    const apiError = this.apiErrors()[fieldName];
    if (apiError) {
      return apiError;
    }

    if (!this.attemptedSubmit()) {
      return '';
    }

    if (fieldName === 'aadhar_image' && !this.hasAadharProof()) {
      return 'Aadhar proof is required.';
    }
    if (fieldName === 'pancard_image' && !this.hasPanProof()) {
      return 'PAN proof is required.';
    }
    if (fieldName === 'live_photo' && !this.hasLivePhoto()) {
      return 'Live photo is required.';
    }

    return '';
  }

  onSubmit(): void {
    this.attemptedSubmit.set(true);
    this.generalError.set('');
    this.apiErrors.set({});

    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid || !this.hasAllRequiredFiles()) {
      this.refreshLocalCompletionHint();
      this.generalError.set('Please complete all required fields before saving.');
      return;
    }

    const raw = this.profileForm.getRawValue();
    const payload = new FormData();
    payload.append('mobile_number', String(raw.mobile_number || '').trim());
    payload.append('marital_status', String(raw.marital_status || '').trim().toLowerCase());
    payload.append('spouse_occupation', String(raw.spouse_occupation || '').trim());
    payload.append('pincode', String(raw.pincode || '').trim());
    payload.append('city', String(raw.city || '').trim());
    payload.append('full_address', String(raw.full_address || '').trim());
    payload.append('employment_type', String(raw.employment_type || '').trim());
    payload.append('what_you_do', String(raw.what_you_do || '').trim());
    payload.append('monthly_salary', String(raw.monthly_salary || '').trim());
    payload.append('requested_amount', String(raw.requested_amount || '').trim());
    payload.append('aadhar_number', String(raw.aadhar_number || '').trim());
    payload.append('pan_number', String(raw.pan_number || '').trim().toUpperCase());

    if (this.selectedAadharProof()) {
      payload.append('aadhar_image', this.selectedAadharProof() as Blob);
    }
    if (this.selectedPanProof()) {
      payload.append('pancard_image', this.selectedPanProof() as Blob);
    }
    if (this.selectedLivePhoto()) {
      payload.append('live_photo', this.selectedLivePhoto() as Blob);
    }

    this.submitting.set(true);
    this.authService.updateBackendUserProfile(payload).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.applyProfilePayload(response);
        this.notificationService.success('Profile updated successfully.');

        if (response.profile_complete) {
          void this.router.navigateByUrl(this.redirectAfterSave);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        const errBody = err?.error || {};
        const nextErrors: Record<string, string> = {};

        Object.keys(errBody || {}).forEach((key) => {
          const value = errBody[key];
          if (Array.isArray(value)) {
            nextErrors[key] = String(value[0] || '');
          } else if (typeof value === 'string') {
            nextErrors[key] = value;
          }
        });

        this.apiErrors.set(nextErrors);
        this.generalError.set(
          nextErrors['non_field_errors']
          || nextErrors['error']
          || 'Could not save profile. Please check the highlighted fields.'
        );
      }
    });
  }

  private setupSpouseValidation(): void {
    const spouseControl = this.profileForm.get('spouse_occupation');
    const maritalControl = this.profileForm.get('marital_status');
    if (!spouseControl || !maritalControl) {
      return;
    }

    const applyRule = (status: unknown) => {
      if (String(status || '').toLowerCase() === 'married') {
        spouseControl.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        spouseControl.clearValidators();
        spouseControl.setValue('', { emitEvent: false });
      }
      spouseControl.updateValueAndValidity({ emitEvent: false });
      this.refreshLocalCompletionHint();
    };

    applyRule(maritalControl.value);
    this.maritalSub = maritalControl.valueChanges.subscribe((status) => applyRule(status));
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.authService.getBackendUserProfile().subscribe({
      next: (response) => {
        this.applyProfilePayload(response);
        this.loading.set(false);
        if (response.profile_complete) {
          void this.router.navigateByUrl(this.redirectAfterSave);
        }
      },
      error: () => {
        this.loading.set(false);
        this.generalError.set('Could not load profile data. Please refresh and try again.');
      }
    });
  }

  private applyProfilePayload(response: BackendUserProfileResponse): void {
    this.profileForm.patchValue({
      mobile_number: response.mobile_number || '',
      marital_status: response.marital_status || '',
      spouse_occupation: response.spouse_occupation || '',
      pincode: response.pincode || '',
      city: response.city || '',
      full_address: response.full_address || '',
      employment_type: response.employment_type || '',
      what_you_do: response.what_you_do || '',
      monthly_salary: response.monthly_salary || '',
      requested_amount: response.requested_amount || '',
      aadhar_number: response.aadhar_number || '',
      pan_number: response.pan_number || ''
    }, { emitEvent: false });

    const maritalStatus = String(response.marital_status || '').toLowerCase();
    if (maritalStatus === 'married') {
      const spouseControl = this.profileForm.get('spouse_occupation');
      spouseControl?.setValidators([Validators.required, Validators.minLength(3)]);
      spouseControl?.updateValueAndValidity({ emitEvent: false });
    }

    this.existingAadharFileName.set(this.fileName(response.aadhar_image));
    this.existingPanFileName.set(this.fileName(response.pancard_image));
    this.existingLivePhotoName.set(this.fileName(response.live_photo));

    this.missingFields.set(Array.isArray(response.missing_fields) ? response.missing_fields : this.computeLocalMissingFields());
    this.progress.set(Number(response.profile_progress ?? 0));
    this.refreshLocalCompletionHint();
  }

  private refreshLocalCompletionHint(): void {
    const missing = this.computeLocalMissingFields();
    this.missingFields.set(missing);

    const total = this.totalRequiredFields();
    const completed = total - missing.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 100;
    this.progress.set(pct);
  }

  private computeLocalMissingFields(): string[] {
    const raw = this.profileForm.getRawValue();
    const missing: string[] = [];

    const requiredFields = [
      'mobile_number',
      'marital_status',
      'pincode',
      'city',
      'full_address',
      'employment_type',
      'what_you_do',
      'monthly_salary',
      'requested_amount',
      'aadhar_number',
      'pan_number'
    ];

    requiredFields.forEach((fieldName) => {
      const value = raw[fieldName];
      if (value === null || value === undefined || String(value).trim() === '') {
        missing.push(fieldName);
      }
    });

    if (String(raw.marital_status || '').toLowerCase() === 'married' && String(raw.spouse_occupation || '').trim() === '') {
      missing.push('spouse_occupation');
    }

    if (!this.hasAadharProof()) {
      missing.push('aadhar_image');
    }
    if (!this.hasPanProof()) {
      missing.push('pancard_image');
    }
    if (!this.hasLivePhoto()) {
      missing.push('live_photo');
    }

    return missing;
  }

  private totalRequiredFields(): number {
    const maritalStatus = String(this.profileForm.get('marital_status')?.value || '').toLowerCase();
    return maritalStatus === 'married' ? 15 : 14;
  }

  private hasAadharProof(): boolean {
    return !!this.selectedAadharProof() || !!this.existingAadharFileName();
  }

  private hasPanProof(): boolean {
    return !!this.selectedPanProof() || !!this.existingPanFileName();
  }

  private hasLivePhoto(): boolean {
    return !!this.selectedLivePhoto() || !!this.existingLivePhotoName();
  }

  private hasAllRequiredFiles(): boolean {
    return this.hasAadharProof() && this.hasPanProof() && this.hasLivePhoto();
  }

  private fileName(path: unknown): string {
    if (!path || typeof path !== 'string') {
      return '';
    }
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  }
}
