import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentUserSummary } from '../../core/models/agent-user.model';
import { AgreementApiService } from '../../core/services/agreement-api.service';
import { AgentUserApiService } from '../../core/services/agent-user-api.service';

interface EditableQuestionRow {
  questionId: number;
  description: string;
}

@Component({
  selector: 'app-agent-agreements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-10">
      <div class="mb-6">
        <h1 class="text-2xl md:text-3xl font-display font-bold text-primary mb-1">Agreement Question Set</h1>
        <p class="text-secondary text-sm">Single global set, maximum 20 question IDs. Answers are always Yes/No.</p>
      </div>

      <section class="bg-surface border border-border rounded-xl shadow-sm p-5 mb-6">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h2 class="text-lg font-semibold text-primary">Manage Questions</h2>
          <div class="text-xs text-secondary">{{ questionRows().length }}/20</div>
        </div>

        <p class="text-xs text-secondary mb-4">
          If you update a question description for the same ID, it reflects on user side automatically.
          If user already answered that ID, it stays readonly for that user.
        </p>

        <div class="space-y-3">
          <div *ngFor="let row of questionRows(); let i = index" class="grid grid-cols-1 md:grid-cols-[110px_1fr_auto] gap-2 items-start">
            <div>
              <label class="block text-xs text-secondary mb-1">Question ID</label>
              <div class="h-[42px] rounded-lg border border-border bg-surface-2 px-3 flex items-center text-sm font-semibold text-primary">
                {{ row.questionId }}
              </div>
            </div>
            <div>
              <label class="block text-xs text-secondary mb-1">Description</label>
              <textarea
                rows="2"
                [(ngModel)]="row.description"
                placeholder="Enter agreement question text"
                class="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary"></textarea>
            </div>
            <button
              type="button"
              (click)="removeRow(i)"
              class="mt-6 md:mt-7 px-3 py-2 rounded border border-error text-error hover:bg-error/10 text-xs font-medium">
              Remove
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="addRow()"
            [disabled]="questionRows().length >= 20"
            class="px-3 py-2 rounded border border-border text-sm text-primary hover:bg-surface-2 disabled:opacity-50">
            Add Question
          </button>

          <button
            type="button"
            (click)="saveQuestionSet()"
            [disabled]="saving()"
            class="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-60">
            {{ saving() ? 'Saving...' : 'Save Question Set' }}
          </button>

          <button
            type="button"
            (click)="reloadQuestions()"
            [disabled]="loading()"
            class="px-3 py-2 rounded border border-border text-sm text-primary hover:bg-surface-2 disabled:opacity-50">
            Reload
          </button>
        </div>

        <p *ngIf="message()" class="mt-3 text-sm" [ngClass]="messageError() ? 'text-error' : 'text-success'">{{ message() }}</p>
      </section>

      <section class="bg-surface border border-border rounded-xl shadow-sm p-5">
        <h2 class="text-lg font-semibold text-primary mb-2">User Agreement Access + Reset</h2>
        <p class="text-xs text-secondary mb-4">Enable/disable agreement tab per user. Reset clears submitted answers and uploaded signature/video.</p>

        <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label class="block text-xs text-secondary mb-1">Select User</label>
            <select [(ngModel)]="selectedUserId" class="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="">Select user</option>
              <option *ngFor="let user of users()" [value]="user.id">
                {{ displayName(user) }} ({{ user.id }})
              </option>
            </select>
          </div>

          <button
            type="button"
            (click)="resetUserAgreements()"
            [disabled]="resetting() || !selectedUserId"
            class="px-4 py-2 rounded border border-error text-error hover:bg-error/10 text-sm font-medium disabled:opacity-50">
            {{ resetting() ? 'Resetting...' : 'Reset Agreements' }}
          </button>
        </div>

        <div class="mt-4 rounded-lg border border-border bg-surface-2 p-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs text-secondary">Agreement Tab Visibility</p>
            <p class="text-sm font-semibold" [ngClass]="selectedUserAgreementEnabled() ? 'text-success' : 'text-warning'">
              {{ selectedUserAgreementEnabled() ? 'Enabled for this user' : 'Disabled for this user' }}
            </p>
          </div>
          <button
            type="button"
            (click)="toggleUserAgreementVisibility()"
            [disabled]="visibilitySaving() || !selectedUserId"
            class="px-4 py-2 rounded border text-sm font-medium disabled:opacity-50"
            [ngClass]="selectedUserAgreementEnabled()
              ? 'border-warning text-warning hover:bg-warning/10'
              : 'border-success text-success hover:bg-success/10'">
            {{ visibilitySaving()
              ? 'Saving...'
              : (selectedUserAgreementEnabled() ? 'Disable Agreement Tab' : 'Enable Agreement Tab') }}
          </button>
        </div>
      </section>
    </div>
  `
})
export class AgentAgreementsComponent implements OnInit {
  questionRows = signal<EditableQuestionRow[]>([]);
  users = signal<AgentUserSummary[]>([]);

  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  resetting = signal<boolean>(false);
  visibilitySaving = signal<boolean>(false);
  message = signal<string>('');
  messageError = signal<boolean>(false);

  selectedUserId = '';

  constructor(
    private agreementApi: AgreementApiService,
    private agentUsersApi: AgentUserApiService
  ) { }

  ngOnInit(): void {
    this.reloadQuestions();
    this.agentUsersApi.loadUsers(true).subscribe((users) => {
      this.users.set(users);
      if (!this.selectedUserId && users.length > 0) {
        this.selectedUserId = String(users[0].id);
      }
    });
  }

  addRow(): void {
    const current = [...this.questionRows()];
    if (current.length >= 20) {
      return;
    }

    const usedIds = new Set(current.map(item => Number(item.questionId)));
    let nextId = 1;
    while (usedIds.has(nextId) && nextId <= 20) {
      nextId += 1;
    }

    current.push({ questionId: Math.min(nextId, 20), description: '' });
    this.questionRows.set(current);
  }

  removeRow(index: number): void {
    const current = [...this.questionRows()];
    current.splice(index, 1);
    this.questionRows.set(current);
  }

  reloadQuestions(): void {
    this.loading.set(true);
    this.agreementApi.getAgentQuestions().subscribe((questions) => {
      this.questionRows.set(questions.map(item => ({
        questionId: Number(item.questionId),
        description: String(item.description || '')
      })));
      this.loading.set(false);
    });
  }

  saveQuestionSet(): void {
    this.message.set('');
    this.messageError.set(false);

    const normalized = this.questionRows().map(item => ({
      questionId: Number(item.questionId),
      description: String(item.description || '').trim()
    })).filter(item => Number.isFinite(item.questionId) && item.questionId >= 1 && item.questionId <= 20);

    if (normalized.length === 0) {
      this.messageError.set(true);
      this.message.set('Add at least one question to save.');
      return;
    }

    if (normalized.length > 20) {
      this.messageError.set(true);
      this.message.set('Maximum 20 questions allowed.');
      return;
    }

    const idSet = new Set<number>();
    for (const row of normalized) {
      if (!row.description) {
        this.messageError.set(true);
        this.message.set(`Question ${row.questionId} description is required.`);
        return;
      }
      if (idSet.has(row.questionId)) {
        this.messageError.set(true);
        this.message.set('Duplicate question IDs are not allowed.');
        return;
      }
      idSet.add(row.questionId);
    }

    this.saving.set(true);
    this.agreementApi.saveAgentQuestions(normalized).subscribe((saved) => {
      this.saving.set(false);
      if (!saved.length) {
        this.messageError.set(true);
        this.message.set('Could not save question set. Please retry.');
        return;
      }

      this.questionRows.set(saved.map(item => ({
        questionId: Number(item.questionId),
        description: String(item.description || '')
      })));
      this.messageError.set(false);
      this.message.set('Agreement question set saved successfully.');
    });
  }

  resetUserAgreements(): void {
    if (!this.selectedUserId) {
      return;
    }

    this.resetting.set(true);
    this.agreementApi.resetUserAgreements(this.selectedUserId).subscribe((ok) => {
      this.resetting.set(false);
      this.messageError.set(!ok);
      this.message.set(ok
        ? `Agreement answers reset for user ${this.selectedUserId}.`
        : 'Could not reset user agreements.');
    });
  }

  toggleUserAgreementVisibility(): void {
    if (!this.selectedUserId) {
      return;
    }

    const nextValue = !this.selectedUserAgreementEnabled();
    this.visibilitySaving.set(true);
    this.agreementApi.setUserAgreementVisibility(this.selectedUserId, nextValue).subscribe((ok) => {
      this.visibilitySaving.set(false);
      if (!ok) {
        this.messageError.set(true);
        this.message.set('Could not update agreement visibility. Please retry.');
        return;
      }

      this.users.update((rows) => rows.map((row) => {
        if (String(row.id) !== String(this.selectedUserId)) {
          return row;
        }
        return {
          ...row,
          agreement_tab_enabled: nextValue
        };
      }));

      this.messageError.set(false);
      this.message.set(nextValue
        ? `Agreement tab enabled for user ${this.selectedUserId}.`
        : `Agreement tab disabled for user ${this.selectedUserId}.`);
    });
  }

  selectedUserAgreementEnabled(): boolean {
    const target = this.users().find((item) => String(item.id) === String(this.selectedUserId));
    return !!target?.agreement_tab_enabled;
  }

  displayName(user: AgentUserSummary): string {
    const full = String(user.full_name || '').trim();
    return full || 'Not filled yet';
  }
}
