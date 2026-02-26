import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Announcement, AnnouncementService, AnnouncementType } from '../../../../core/services/announcement.service';
import { AnnouncementCardComponent } from '../../../../shared/components/announcement-card/announcement-card.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { AgentUserApiService } from '../../../../core/services/agent-user-api.service';

@Component({
    selector: 'app-agent-announcements',
    standalone: true,
    imports: [CommonModule, FormsModule, AnnouncementCardComponent],
    template: `
    <div class="px-4 py-8 md:px-8 max-w-[1200px] mx-auto w-full h-full space-y-6 animate-fade-in pb-24">
      <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-primary tracking-tight">Announcement Center</h1>
          <p class="text-sm text-secondary font-medium">Global and private dashboard announcements managed from backend.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="refreshAnnouncements()"
            class="px-4 py-2 rounded-xl border border-border bg-surface text-sm font-semibold text-primary hover:bg-surface-2 transition-colors"
            [disabled]="isLoading() || isSaving()">
            {{ isLoading() ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button
            type="button"
            (click)="openCreator()"
            class="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            [disabled]="isSaving()">
            {{ isCreating() ? (isEditMode() ? 'Editing' : 'Draft Open') : 'New Announcement' }}
          </button>
        </div>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article class="bg-surface rounded-2xl border border-border p-5">
          <p class="text-xs uppercase tracking-wider text-secondary font-bold">Global Active</p>
          <p class="text-2xl font-black text-primary mt-1">{{ globalCount() }} <span class="text-sm text-tertiary font-medium">/ 2</span></p>
        </article>
        <article class="bg-surface rounded-2xl border border-border p-5">
          <p class="text-xs uppercase tracking-wider text-secondary font-bold">Private Active</p>
          <p class="text-2xl font-black text-primary mt-1">{{ privateCount() }}</p>
        </article>
        <article class="bg-surface rounded-2xl border border-border p-5">
          <p class="text-xs uppercase tracking-wider text-secondary font-bold">Total Active</p>
          <p class="text-2xl font-black text-primary mt-1">{{ announcements().length }}</p>
        </article>
      </section>

      <section *ngIf="isCreating()" class="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div class="p-4 md:p-5 border-b border-border flex items-center justify-between">
          <h2 class="text-lg font-bold text-primary">{{ isEditMode() ? 'Edit Announcement' : 'Create Announcement' }}</h2>
          <button type="button" (click)="cancelCreate()" class="text-sm font-semibold text-secondary hover:text-primary">Close</button>
        </div>

        <div class="p-4 md:p-6 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              (click)="setType('GLOBAL')"
              class="rounded-xl border px-3 py-2 text-sm font-bold transition-colors"
              [class.border-accent]="formType() === 'GLOBAL'"
              [class.bg-accent-50]="formType() === 'GLOBAL'"
              [class.text-accent]="formType() === 'GLOBAL'"
              [class.border-border]="formType() !== 'GLOBAL'">
              Global
            </button>
            <button
              type="button"
              (click)="setType('PRIVATE')"
              class="rounded-xl border px-3 py-2 text-sm font-bold transition-colors"
              [class.border-blue-500]="formType() === 'PRIVATE'"
              [class.bg-blue-50]="formType() === 'PRIVATE'"
              [class.text-blue-700]="formType() === 'PRIVATE'"
              [class.border-border]="formType() !== 'PRIVATE'">
              Private
            </button>
          </div>

          <div *ngIf="formType() === 'PRIVATE'" class="space-y-2">
            <label class="block text-sm font-semibold text-primary">Search User</label>
            <input
              type="text"
              [ngModel]="userSearch()"
              (ngModelChange)="userSearch.set($event)"
              placeholder="Search by name, mobile, or email"
              class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <select
              [(ngModel)]="formTargetUserId"
              class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="" disabled>Select user</option>
              <option *ngFor="let u of filteredAppUsers()" [value]="u.id">
                {{ u.full_name }} - {{ u.mobile_number || u.email }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-primary">Title</label>
            <input
              type="text"
              [(ngModel)]="formTitle"
              maxlength="180"
              placeholder="Urgent: Upload Voter ID"
              class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-primary">Description</label>
            <textarea
              [(ngModel)]="formDescription"
              rows="3"
              maxlength="3000"
              placeholder="Tell the user what is needed and why."
              class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-primary">CTA</label>
              <input
                type="text"
                [(ngModel)]="formCtaText"
                maxlength="80"
                placeholder="Upload Voter ID"
                class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-primary">Priority Label</label>
              <input
                type="text"
                [(ngModel)]="formPriorityLabel"
                maxlength="32"
                placeholder="IMPORTANT"
                class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-3">
            <button type="button" (click)="cancelCreate()" class="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-secondary hover:bg-surface-2">Cancel</button>
            <button
              type="button"
              (click)="submitAnnouncement()"
              [disabled]="!isFormValid() || isSaving()"
              class="px-5 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSaving() ? 'Saving...' : (isEditMode() ? 'Update Announcement' : 'Publish Announcement') }}
            </button>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 class="text-lg font-bold text-primary">Active Announcements</h2>
          <div class="flex items-center gap-2">
            <input
              type="text"
              [ngModel]="listSearchTerm()"
              (ngModelChange)="listSearchTerm.set($event)"
              placeholder="Search announcements"
              class="w-full md:w-64 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            <button
              type="button"
              (click)="refreshAnnouncements(listSearchTerm())"
              class="px-3 py-2 rounded-lg border border-border text-sm font-semibold text-primary hover:bg-surface-2"
              [disabled]="isLoading()">
              Search
            </button>
          </div>
        </div>

        <div *ngIf="isLoading()" class="rounded-2xl border border-border bg-surface px-4 py-6 text-center text-sm font-medium text-secondary animate-pulse">
          Loading announcements...
        </div>

        <div *ngIf="!isLoading() && announcements().length === 0" class="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm font-medium text-secondary">
          No active announcements found.
        </div>

        <div class="space-y-4">
          <article *ngFor="let item of announcements()" class="relative">
            <app-announcement-card
              [announcement]="item"
              [showTarget]="true"
              (onAction)="triggerPreviewAction(item)">
            </app-announcement-card>
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                (click)="startEdit(item)"
                class="px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-bold text-primary hover:bg-surface-2">
                Edit
              </button>
              <button
                type="button"
                (click)="deleteItem(item.id)"
                class="px-3 py-1.5 rounded-full bg-error text-white text-xs font-bold hover:bg-error/90">
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  `
})
export class AgentAnnouncementsComponent implements OnInit {
    private readonly announcementService = inject(AnnouncementService);
    private readonly notificationService = inject(NotificationService);
    private readonly agentUserService = inject(AgentUserApiService);

    readonly announcements = computed(() => this.announcementService.getAllAnnouncements());
    readonly counts = this.announcementService.counts;
    readonly globalCount = computed(() => this.counts().globalActive);
    readonly privateCount = computed(() => this.counts().privateActiveTotal);
    readonly availableAppUsers = computed(() => this.agentUserService.users());

    readonly isCreating = signal(false);
    readonly isLoading = signal(false);
    readonly isSaving = signal(false);
    readonly formType = signal<AnnouncementType>('GLOBAL');
    readonly userSearch = signal('');
    readonly listSearchTerm = signal('');
    readonly editingAnnouncementId = signal<string | null>(null);

    readonly isEditMode = computed(() => !!this.editingAnnouncementId());
    readonly filteredAppUsers = computed(() => {
        const term = this.userSearch().trim().toLowerCase();
        if (!term) {
            return this.availableAppUsers();
        }
        return this.availableAppUsers().filter((u) => {
            const haystack = `${u.full_name} ${u.mobile_number} ${u.email}`.toLowerCase();
            return haystack.includes(term);
        });
    });

    formTargetUserId = '';
    formTitle = '';
    formDescription = '';
    formCtaText = '';
    formPriorityLabel = 'IMPORTANT';

    ngOnInit() {
        if (this.availableAppUsers().length === 0) {
            this.agentUserService.loadUsers().subscribe();
        }
        this.refreshAnnouncements();
    }

    refreshAnnouncements(searchTerm: string = '') {
        this.isLoading.set(true);
        this.announcementService.loadAgentAnnouncements(searchTerm).subscribe({
            complete: () => this.isLoading.set(false)
        });
    }

    openCreator() {
        this.resetForm();
        this.isCreating.set(true);
    }

    cancelCreate() {
        this.resetForm();
        this.isCreating.set(false);
    }

    setType(type: AnnouncementType) {
        this.formType.set(type);
        if (type === 'GLOBAL') {
            this.formTargetUserId = '';
            this.userSearch.set('');
        }
    }

    isFormValid(): boolean {
        if (!this.formTitle.trim() || !this.formDescription.trim() || !this.formCtaText.trim()) {
            return false;
        }
        if (this.formType() === 'PRIVATE' && !String(this.formTargetUserId || '').trim()) {
            return false;
        }
        return true;
    }

    startEdit(item: Announcement) {
        this.isCreating.set(true);
        this.editingAnnouncementId.set(item.id);
        this.formType.set(item.type);
        this.formTargetUserId = item.targetUserId || '';
        this.formTitle = item.title;
        this.formDescription = item.description;
        this.formCtaText = item.ctaText;
        this.formPriorityLabel = item.priorityLabel || 'IMPORTANT';
    }

    submitAnnouncement() {
        if (!this.isFormValid() || this.isSaving()) {
            return;
        }

        const payload = {
            type: this.formType(),
            targetUserId: this.formType() === 'PRIVATE' ? this.formTargetUserId : undefined,
            title: this.formTitle.trim(),
            description: this.formDescription.trim(),
            ctaText: this.formCtaText.trim(),
            priorityLabel: this.formPriorityLabel.trim() || 'IMPORTANT'
        } as Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>;

        this.isSaving.set(true);
        const editId = this.editingAnnouncementId();
        const request$ = editId
            ? this.announcementService.updateAnnouncement(editId, payload)
            : this.announcementService.createAnnouncement(payload);

        request$.subscribe({
            next: (result) => {
                if (!result.success) {
                    this.notificationService.error(result.message || 'Unable to save announcement.');
                    return;
                }
                this.notificationService.success(result.message || 'Announcement saved successfully.');
                this.cancelCreate();
                this.refreshAnnouncements(this.listSearchTerm());
            },
            error: () => this.notificationService.error('Unable to save announcement right now.'),
            complete: () => this.isSaving.set(false)
        });
    }

    deleteItem(id: string) {
        if (!confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        this.announcementService.deleteAnnouncement(id).subscribe((result) => {
            if (!result.success) {
                this.notificationService.error(result.message || 'Delete failed.');
                return;
            }
            this.notificationService.success(result.message || 'Announcement deleted.');
            this.refreshAnnouncements(this.listSearchTerm());
        });
    }

    triggerPreviewAction(item: Announcement) {
        this.notificationService.show({ message: `CTA Preview: ${item.ctaText}`, type: 'info' });
    }

    private resetForm() {
        this.editingAnnouncementId.set(null);
        this.formType.set('GLOBAL');
        this.userSearch.set('');
        this.formTargetUserId = '';
        this.formTitle = '';
        this.formDescription = '';
        this.formCtaText = '';
        this.formPriorityLabel = 'IMPORTANT';
    }
}
