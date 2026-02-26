import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Partner } from '../../core/models/partner.model';
import { PartnerService } from '../../core/services/partner.service';
import { ApplicationService } from '../../core/services/application.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomValidators } from '../../shared/validators/custom.validators';
import { StepperComponent } from '../../shared/components/stepper/stepper.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { UploadZoneComponent } from '../../shared/components/upload-zone/upload-zone.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, StepperComponent, ButtonComponent,
    InputComponent, UploadZoneComponent,
  ],
  template: `
    <div class="min-h-screen bg-surface-2 pt-16 pb-20 fade-in" [style.border-top]="'4px solid ' + (partner?.color || 'var(--primary)')">
      <div class="container max-w-2xl">
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-primary mb-1">Registration</h1>
            <p class="text-secondary text-sm">Applying for finance with <span class="font-bold">{{ partner?.name }}</span></p>
          </div>
          <div class="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-xl shadow-sm"
               [style.background-color]="partner?.color">
            {{ partner?.name?.charAt(0) }}
          </div>
        </div>

        <app-stepper [steps]="steps" [currentStepIndex]="currentStep()"></app-stepper>

        <p class="mb-5 text-xs text-secondary">Draft is auto-saved for this browser session.</p>

        <!-- Main Form Card -->
        <div class="bg-surface rounded-2xl shadow-sm border border-border p-6 md:p-8">
          <form [formGroup]="applyForm" (ngSubmit)="onSubmit()">
            
            <!-- Step 0: Personal Info -->
            <div *ngIf="currentStep() === 0" class="slide-up">
              <h2 class="text-xl font-bold text-primary mb-6">Personal Details</h2>
              
              <app-input 
                id="firstName" formControlName="firstName" label="First Name" 
                placeholder="Legal First Name" [required]="true"
                [error]="getFormError('firstName', 'Required')">
              </app-input>
              
              <app-input 
                id="lastName" formControlName="lastName" label="Last Name" 
                placeholder="Legal Last Name" [required]="true"
                [error]="getFormError('lastName', 'Required')">
              </app-input>

              <app-input 
                id="email" formControlName="email" type="email" label="Email Address" 
                placeholder="you@example.com" [required]="true"
                [error]="getFormError('email', 'Valid email required')">
              </app-input>
              
              <app-input 
                id="phone" formControlName="phone" type="tel" label="Mobile Number" 
                placeholder="10 digit unformatted" [required]="true"
                [error]="getFormError('phone', 'Valid 10-digit phone required')">
              </app-input>

              <div class="mb-6">
                <label class="block text-sm font-medium text-secondary mb-2">Marital Status <span class="text-error">*</span></label>
                <div class="grid grid-cols-2 gap-3">
                  <div 
                    class="border rounded-md p-3 text-center cursor-pointer transition-standard"
                    [ngClass]="applyForm.get('maritalStatus')?.value === 'married' ? 'border-primary bg-primary-light/10 text-primary font-bold' : 'border-border text-secondary hover:border-primary-light'"
                    (click)="setMaritalStatus('married')">
                    Married
                  </div>
                  <div 
                    class="border rounded-md p-3 text-center cursor-pointer transition-standard"
                    [ngClass]="applyForm.get('maritalStatus')?.value === 'unmarried' ? 'border-primary bg-primary-light/10 text-primary font-bold' : 'border-border text-secondary hover:border-primary-light'"
                    (click)="setMaritalStatus('unmarried')">
                    Unmarried
                  </div>
                </div>
                <p *ngIf="hasError('maritalStatus')" class="mt-1 text-xs text-error slide-up">Marital status is required</p>
              </div>

              <div class="mb-4" *ngIf="applyForm.get('maritalStatus')?.value === 'married'">
                <label class="block text-sm font-medium text-secondary mb-1">What does your better half do? (Husband/Wife) <span class="text-error">*</span></label>
                <textarea 
                  formControlName="spouseOccupation" 
                  rows="3" 
                  class="w-full text-base p-4 rounded-md border text-primary transition-standard resize-none border-border focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
                  placeholder="Example: She is a housewife. She is a teacher.">
                </textarea>
                <p *ngIf="hasError('spouseOccupation')" class="mt-1 text-xs text-error slide-up">Please provide spouse occupation details</p>
              </div>

            </div>

            <!-- Step 1: Address Details -->
            <div *ngIf="currentStep() === 1" class="slide-up">
              <h2 class="text-xl font-bold text-primary mb-6">Current Location</h2>
              
              <app-input 
                id="pincode" formControlName="pincode" type="tel" label="PIN Code" 
                placeholder="ZIP / Postal Code" [required]="true"
                [error]="getFormError('pincode', 'Valid postal code required')">
              </app-input>
              
              <app-input 
                id="city" formControlName="city" label="City" 
                placeholder="City Name" [required]="true"
                [error]="getFormError('city', 'Required')">
              </app-input>

              <div class="mb-4">
                <label class="block text-sm font-medium text-secondary mb-1">Full Address <span class="text-error">*</span></label>
                <textarea 
                  formControlName="address" 
                  rows="3" 
                  class="w-full text-base p-4 rounded-md border text-primary transition-standard resize-none border-border focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
                  placeholder="House, Street, Area">
                </textarea>
                <p *ngIf="hasError('address')" class="mt-1 text-xs text-error slide-up">Address is required</p>
              </div>
            </div>

            <!-- Step 2: KYC -->
            <div *ngIf="currentStep() === 2" class="slide-up" formGroupName="kyc">
              <h2 class="text-xl font-bold text-primary mb-2">KYC Details</h2>
              <p class="text-sm text-secondary mb-6">Secure 256-bit encrypted transmission.</p>

              <div class="mb-6">
                <app-input 
                  id="aadhaarNumber" formControlName="aadhaarNumber" label="Aadhaar Number" 
                  placeholder="12-digit Aadhaar number" [required]="true" [monospace]="true"
                  [error]="applyForm.get('kyc.aadhaarNumber')?.dirty && applyForm.get('kyc.aadhaarNumber')?.invalid ? 'Valid 12-digit Aadhaar number is required' : ''">
                </app-input>
              </div>

              <div class="mb-6">
                <app-input 
                  id="panNumber" formControlName="panNumber" label="PAN Number" 
                  placeholder="e.g. ABCDE1234F" [required]="true" [monospace]="true"
                  [error]="applyForm.get('kyc.panNumber')?.dirty && applyForm.get('kyc.panNumber')?.invalid ? 'Valid PAN number is required' : ''">
                </app-input>
              </div>
              
              <div class="mb-6">
                <label class="block text-sm font-medium text-secondary mb-2">Aadhaar Proof Upload</label>
                <app-upload-zone 
                  label="Upload Aadhaar flip video or image"
                  hint="Video recommended. If image, upload both Aadhaar front and back."
                  accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
                  [uploading]="uploadingAadhaarProof()"
                  [progress]="aadhaarProofProgress()"
                  (fileDropped)="onAadhaarProofUpload($event)">
                </app-upload-zone>
                <p *ngIf="uploadedAadhaarProofFile()" class="mt-2 text-xs text-success flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Aadhaar proof uploaded successfully
                </p>
              </div>

              <div class="mb-6" *ngIf="uploadedAadhaarProofFile() && !isAadhaarProofVideo()">
                <label class="block text-sm font-medium text-secondary mb-2">Aadhaar Back Image (Required for Image Upload)</label>
                <app-upload-zone 
                  label="Upload Aadhaar back image"
                  hint="Front and back both are required when Aadhaar is uploaded as image."
                  accept="image/jpeg,image/png,image/webp"
                  [uploading]="uploadingAadhaarBack()"
                  [progress]="aadhaarBackProgress()"
                  (fileDropped)="onAadhaarBackUpload($event)">
                </app-upload-zone>
                <p *ngIf="uploadedAadhaarBackFile()" class="mt-2 text-xs text-success flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Aadhaar back image uploaded
                </p>
              </div>

              <div class="mb-2">
                <label class="block text-sm font-medium text-secondary mb-2">PAN Proof Upload</label>
                <app-upload-zone 
                  label="Upload PAN flip video or image"
                  hint="Video recommended. Image is also accepted."
                  accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
                  [uploading]="uploadingPanProof()"
                  [progress]="panProofProgress()"
                  (fileDropped)="onPanProofUpload($event)">
                </app-upload-zone>
                <p *ngIf="uploadedPanProofFile()" class="mt-2 text-xs text-success flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  PAN proof uploaded successfully
                </p>
              </div>

              <div class="mt-6">
                <label class="block text-sm font-medium text-secondary mb-2">Upload Your Current Live Picture</label>
                <app-upload-zone
                  label="Upload current live selfie photo"
                  hint="Please upload a current live photo from your camera (no old gallery photo)."
                  accept="image/jpeg,image/png,image/webp"
                  [uploading]="uploadingLivePhoto()"
                  [progress]="livePhotoProgress()"
                  (fileDropped)="onLivePhotoUpload($event)">
                </app-upload-zone>
                <p *ngIf="uploadedLivePhotoFile()" class="mt-2 text-xs text-success flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Live picture uploaded successfully
                </p>
              </div>
            </div>

            <!-- Step 3: Finance Needed -->
            <div *ngIf="currentStep() === 3" class="slide-up">
              <h2 class="text-xl font-bold text-primary mb-6">Finance Details</h2>
              
              <app-input 
                id="requestedAmount" formControlName="requestedAmount" type="number" label="Requested Amount ($)" 
                placeholder="e.g. 5000" [required]="true" [monospace]="true"
                [hint]="'Max applicable: $' + (partner?.max_amount || 0)"
                [error]="getFormError('requestedAmount', 'Amount required (Min 10k, Max ' + (partner?.max_amount || 0) + ')')">
              </app-input>
              
              <div class="mb-6">
                <label class="block text-sm font-medium text-secondary mb-2">Employment Type <span class="text-error">*</span></label>
                <div class="grid grid-cols-2 gap-3">
                  <div 
                    class="border rounded-md p-3 text-center cursor-pointer transition-standard"
                    [ngClass]="applyForm.get('employmentType')?.value === 'salaried' ? 'border-primary bg-primary-light/10 text-primary font-bold' : 'border-border text-secondary hover:border-primary-light'"
                    (click)="applyForm.patchValue({employmentType: 'salaried'})">
                    Salaried
                  </div>
                  <div 
                    class="border rounded-md p-3 text-center cursor-pointer transition-standard"
                    [ngClass]="applyForm.get('employmentType')?.value === 'self-employed' ? 'border-primary bg-primary-light/10 text-primary font-bold' : 'border-border text-secondary hover:border-primary-light'"
                    (click)="applyForm.patchValue({employmentType: 'self-employed'})">
                    Self-Employed
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-secondary mb-1">What do you do? <span class="text-error">*</span></label>
                <textarea 
                  formControlName="occupationDetails" 
                  rows="3" 
                  class="w-full text-base p-4 rounded-md border text-primary transition-standard resize-none border-border focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
                  placeholder="Example: I am a student. I do a job in a bank/hotel/school.">
                </textarea>
                <p *ngIf="hasError('occupationDetails')" class="mt-1 text-xs text-error slide-up">Occupation details are required</p>
              </div>
              
              <app-input 
                id="monthlySalaryInr" formControlName="monthlySalaryInr" type="number" label="Your Monthly Salary (INR)" 
                placeholder="e.g. 50000" [required]="true" [monospace]="true"
                [error]="getFormError('monthlySalaryInr', 'Required (Min INR 1,000)')">
              </app-input>

            </div>

            <!-- Step 4: Account Creation -->
            <div *ngIf="currentStep() === 4" class="slide-up">
              <h2 class="text-xl font-bold text-primary mb-4">Account Security</h2>
              <p class="text-sm text-secondary mb-6">Set a password for your FastEMIs dashboard to track your application.</p>

              <app-input 
                id="password" formControlName="password" type="password" label="Create Password" 
                placeholder="Min 8 characters" [required]="true"
                [error]="getFormError('password', 'Requires min 8 characters')">
              </app-input>

              <app-input 
                id="confirmPassword" formControlName="confirmPassword" type="password" label="Confirm Password" 
                placeholder="Retype password" [required]="true"
                [error]="applyForm.errors?.['passwordMismatch'] ? 'Passwords must match' : ''">
              </app-input>

            </div>

            <!-- Form Navigation -->
            <div class="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-border">
              <app-button 
                *ngIf="currentStep() > 0"
                variant="ghost" 
                (onClick)="prevStep()">
                Back
              </app-button>
              <div *ngIf="currentStep() === 0" class="flex-1"></div>

              <app-button 
                *ngIf="currentStep() < steps.length - 1"
                variant="primary" 
                (onClick)="nextStep()"
                [disabled]="!canContinueToNext()">
                Continue &rarr;
              </app-button>
              
              <app-button 
                *ngIf="currentStep() === steps.length - 1"
                variant="primary" 
                (onClick)="onSubmit()"
                [disabled]="!isCurrentStepValid() || submitting()">
                {{ submitting() ? 'Submitting...' : 'Submit Application' }}
              </app-button>
            </div>

          </form>
        </div>

      </div>
    </div>
  `
})
export class ApplyComponent implements OnInit, OnDestroy {
  partner: Partner | null = null;
  private routeSub!: Subscription;
  private formValueSub?: Subscription;
  private spouseValidationSub?: Subscription;
  private draftKey: string = '';
  private suppressDraftSave = false;

  steps = ['Info', 'Address', 'KYC', 'Finance', 'Security'];
  currentStep = signal<number>(0);

  applyForm!: FormGroup;

  uploadingAadhaarProof = signal<boolean>(false);
  aadhaarProofProgress = signal<number>(0);
  uploadedAadhaarProofFile = signal<File | null>(null);

  uploadingAadhaarBack = signal<boolean>(false);
  aadhaarBackProgress = signal<number>(0);
  uploadedAadhaarBackFile = signal<File | null>(null);

  uploadingPanProof = signal<boolean>(false);
  panProofProgress = signal<number>(0);
  uploadedPanProofFile = signal<File | null>(null);

  uploadingLivePhoto = signal<boolean>(false);
  livePhotoProgress = signal<number>(0);
  uploadedLivePhotoFile = signal<File | null>(null);

  submitting = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private partnerService: PartnerService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.initForm();

    this.routeSub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.draftKey = `apply_draft_v1_${slug}`;
        this.restoreDraft();
        this.loadPartner(slug);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  loadPartner(slug: string) {
    this.partnerService.getPartnerBySlug(slug).subscribe({
      next: (partner) => {
        this.partner = partner || null;
        // Update max amount validator based on partner
        if (this.partner) {
          this.applyForm.get('requestedAmount')?.setValidators([
            Validators.required,
            Validators.min(10000),
            Validators.max(this.partner.max_amount)
          ]);
          this.applyForm.get('requestedAmount')?.updateValueAndValidity();
        }
      },
      error: () => this.router.navigate(['/'])
    });
  }

  initForm() {
    this.applyForm = this.fb.group({
      // Step 0
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, CustomValidators.phone()]],
      maritalStatus: ['', Validators.required],
      spouseOccupation: [''],
      // Step 1
      pincode: ['', [Validators.required, Validators.pattern('^[1-9][0-9]{5}$')]],
      city: ['', Validators.required],
      address: ['', Validators.required],
      // Step 2
      kyc: this.fb.group({
        aadhaarNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{12}$/)]],
        panNumber: ['', [Validators.required, CustomValidators.taxId()]]
      }),
      // Step 3
      requestedAmount: ['', [Validators.required, Validators.min(1000)]], // max dynamically set
      employmentType: ['', Validators.required],
      occupationDetails: ['', [Validators.required, Validators.minLength(3)]],
      monthlySalaryInr: ['', [Validators.required, Validators.min(1000)]],
      // Step 4
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: CustomValidators.passwordMatch('password', 'confirmPassword') });

    this.setupSpouseOccupationValidation();

    this.formValueSub?.unsubscribe();
    this.formValueSub = this.applyForm.valueChanges.subscribe(() => {
      this.saveDraft();
    });
  }

  // Navigation Logic
  canContinueToNext(): boolean {
    return this.isCurrentStepValid();
  }

  isCurrentStepValid(): boolean {
    const s = this.currentStep();
    if (s === 0) {
      return this.checkGroupValid(['firstName', 'lastName', 'email', 'phone', 'maritalStatus', 'spouseOccupation']);
    }
    if (s === 1) {
      return this.checkGroupValid(['pincode', 'city', 'address']);
    }
    if (s === 2) {
      const kycGroup = this.applyForm.get('kyc') as FormGroup;
      const hasAadhaar = this.uploadedAadhaarProofFile() !== null;
      const hasPan = this.uploadedPanProofFile() !== null;
      const hasAadhaarBackIfNeeded = this.isAadhaarProofVideo() || this.uploadedAadhaarBackFile() !== null;
      const hasLivePhoto = this.uploadedLivePhotoFile() !== null;
      return kycGroup.valid && hasAadhaar && hasPan && hasAadhaarBackIfNeeded && hasLivePhoto;
    }
    if (s === 3) {
      return this.checkGroupValid(['requestedAmount', 'employmentType', 'occupationDetails', 'monthlySalaryInr']);
    }
    if (s === 4) {
      return this.checkGroupValid(['password', 'confirmPassword']) && !this.applyForm.errors?.['passwordMismatch'];
    }
    return false;
  }

  checkGroupValid(fields: string[]): boolean {
    let valid = true;
    fields.forEach(f => {
      const control = this.applyForm.get(f);
      if (control?.invalid) valid = false;
    });
    return valid;
  }

  markGroupTouched(fields: string[]) {
    fields.forEach(f => {
      this.applyForm.get(f)?.markAsTouched();
    });
  }

  nextStep() {
    if (this.canContinueToNext() && this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(v => v + 1);
      this.saveDraft();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Mark fields as touched to show errors
      const s = this.currentStep();
      if (s === 0) this.markGroupTouched(['firstName', 'lastName', 'email', 'phone', 'maritalStatus', 'spouseOccupation']);
      if (s === 1) this.markGroupTouched(['pincode', 'city', 'address']);
      if (s === 2) {
        (this.applyForm.get('kyc') as FormGroup).markAllAsTouched();
        if (!this.uploadedAadhaarProofFile()) {
          this.notificationService.warning('Please upload Aadhaar proof');
        } else if (!this.isAadhaarProofVideo() && !this.uploadedAadhaarBackFile()) {
          this.notificationService.warning('Please upload Aadhaar back image');
        } else if (!this.uploadedPanProofFile()) {
          this.notificationService.warning('Please upload PAN proof');
        } else if (!this.uploadedLivePhotoFile()) {
          this.notificationService.warning('Please upload your current live picture');
        }
      }
      if (s === 3) this.markGroupTouched(['requestedAmount', 'employmentType', 'occupationDetails', 'monthlySalaryInr']);
      if (s === 4) this.markGroupTouched(['password', 'confirmPassword']);
    }
  }

  setMaritalStatus(status: 'married' | 'unmarried') {
    this.applyForm.patchValue({ maritalStatus: status });
    this.applyForm.get('maritalStatus')?.markAsTouched();
    this.applyForm.get('maritalStatus')?.updateValueAndValidity();
    this.saveDraft();
  }

  setupSpouseOccupationValidation() {
    const maritalStatus = this.applyForm.get('maritalStatus');
    const spouseOccupation = this.applyForm.get('spouseOccupation');

    if (!maritalStatus || !spouseOccupation) {
      return;
    }

    this.spouseValidationSub?.unsubscribe();
    this.spouseValidationSub = maritalStatus.valueChanges.subscribe(status => {
      if (status === 'married') {
        spouseOccupation.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        spouseOccupation.clearValidators();
        spouseOccupation.setValue('');
      }
      spouseOccupation.updateValueAndValidity();
    });
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(v => v - 1);
      this.saveDraft();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Error Checking
  hasError(controlName: string): boolean {
    const control = this.applyForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFormError(controlName: string, customMsg: string): string {
    return this.hasError(controlName) ? customMsg : '';
  }

  // Upload Logic
  onAadhaarProofUpload(file: File) {
    if (file.type.startsWith('video/')) {
      this.uploadedAadhaarBackFile.set(null);
    }
    this.simulateUpload(
      file,
      this.uploadingAadhaarProof,
      this.aadhaarProofProgress,
      this.uploadedAadhaarProofFile
    );
  }

  onAadhaarBackUpload(file: File) {
    this.simulateUpload(
      file,
      this.uploadingAadhaarBack,
      this.aadhaarBackProgress,
      this.uploadedAadhaarBackFile
    );
  }

  onPanProofUpload(file: File) {
    this.simulateUpload(
      file,
      this.uploadingPanProof,
      this.panProofProgress,
      this.uploadedPanProofFile
    );
  }

  onLivePhotoUpload(file: File) {
    this.simulateUpload(
      file,
      this.uploadingLivePhoto,
      this.livePhotoProgress,
      this.uploadedLivePhotoFile
    );
  }

  isAadhaarProofVideo(): boolean {
    return this.uploadedAadhaarProofFile()?.type.startsWith('video/') || false;
  }

  private simulateUpload(
    file: File,
    uploadingSignal: { set: (value: boolean) => void },
    progressSignal: { set: (value: number) => void; update: (fn: (value: number) => number) => void },
    fileSignal: { set: (value: File | null) => void }
  ) {
    uploadingSignal.set(true);
    progressSignal.set(0);
    fileSignal.set(null);

    const interval = setInterval(() => {
      progressSignal.update(v => {
        if (v >= 100) {
          clearInterval(interval);
          uploadingSignal.set(false);
          fileSignal.set(file);
          return 100;
        }
        return v + 25;
      });
    }, 350);
  }

  // Submission
  onSubmit() {
    const kycReady = this.uploadedAadhaarProofFile() && this.uploadedPanProofFile() &&
      (this.isAadhaarProofVideo() || this.uploadedAadhaarBackFile()) &&
      this.uploadedLivePhotoFile();

    if (this.applyForm.valid && kycReady) {
      this.submitting.set(true);
      const applicationData = {
        ...this.applyForm.value,
        kycProofs: {
          aadhaarProof: this.uploadedAadhaarProofFile()?.name || null,
          aadhaarBackProof: this.uploadedAadhaarBackFile()?.name || null,
          panProof: this.uploadedPanProofFile()?.name || null,
          livePhoto: this.uploadedLivePhotoFile()?.name || null
        },
        partnerId: this.partner?.id
      };

      this.applicationService.submitApplication(applicationData).subscribe({
        next: (app: any) => {
          this.submitting.set(false);
          this.clearDraft();
          this.notificationService.success('Application submitted successfully!');
          // Redirect to dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.submitting.set(false);
          this.notificationService.error(err.message || 'Submission failed');
        }
      });
    } else {
      this.notificationService.error('Please complete all fields correctly.');
    }
  }

  ngOnDestroy() {
    this.saveDraft();
    this.formValueSub?.unsubscribe();
    this.spouseValidationSub?.unsubscribe();
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  private saveDraft() {
    if (!this.draftKey || !this.applyForm || this.suppressDraftSave) {
      return;
    }

    const payload = {
      step: this.currentStep(),
      form: this.applyForm.getRawValue(),
      savedAt: new Date().toISOString()
    };

    window.sessionStorage.setItem(this.draftKey, JSON.stringify(payload));
  }

  private restoreDraft() {
    if (!this.draftKey || !this.applyForm) {
      return;
    }

    const raw = window.sessionStorage.getItem(this.draftKey);
    if (!raw) {
      return;
    }

    try {
      const payload = JSON.parse(raw) as {
        step?: number;
        form?: Record<string, unknown>;
      };

      this.suppressDraftSave = true;
      if (payload.form) {
        this.applyForm.patchValue(payload.form, { emitEvent: false });
      }
      const step = Math.max(0, Math.min(this.steps.length - 1, Number(payload.step ?? 0)));
      this.currentStep.set(step);
    } catch {
      // ignore bad draft
    } finally {
      this.suppressDraftSave = false;
    }

    if (this.currentStep() >= 2) {
      this.notificationService.warning('Draft restored. Please re-upload KYC files before final submit.');
    }
  }

  private clearDraft() {
    if (!this.draftKey) {
      return;
    }
    window.sessionStorage.removeItem(this.draftKey);
  }
}
