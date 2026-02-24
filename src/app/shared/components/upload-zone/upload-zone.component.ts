import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-upload-zone',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-standard relative"
      [ngClass]="{
        'border-primary bg-surface-3': isDragging(),
        'border-border bg-surface hover:border-primary-light': !isDragging(),
        'border-success': selectedFile()
      }"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">
      
      <input 
        #fileInput
        type="file" 
        class="hidden" 
        [accept]="accept"
        (change)="onFileSelected($event)">

      <ng-container *ngIf="!selectedFile() && !uploading">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="text-secondary mb-3" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p class="text-sm font-medium text-primary text-center">{{ label }}</p>
        <p class="text-xs text-muted text-center mt-1">{{ hint }}</p>
      </ng-container>

      <ng-container *ngIf="uploading">
        <!-- Circular Progress (Fake) -->
        <div class="w-8 h-8 rounded-full border-2 border-surface-3 border-t-primary animate-spin mb-3"></div>
        <p class="text-sm font-medium text-primary text-center">Uploading {{ progress }}%</p>
      </ng-container>

      <ng-container *ngIf="selectedFile() && !uploading">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="text-success mb-3" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <p class="text-sm font-medium text-primary max-w-full truncate px-4">{{ selectedFile()?.name }}</p>
        <p class="text-xs text-muted mt-1">{{ formatBytes(selectedFile()?.size || 0) }}</p>
      </ng-container>
    </div>
  `
})
export class UploadZoneComponent {
    @Input() label: string = 'Tap to upload or drag & drop';
    @Input() hint: string = 'PNG, JPG or MP4 up to 50MB';
    @Input() accept: string = 'image/*,video/mp4';
    @Input() uploading: boolean = false;
    @Input() progress: number = 0;

    @Output() fileDropped = new EventEmitter<File>();

    isDragging = signal<boolean>(false);
    selectedFile = signal<File | null>(null);

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(false);

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.handleFile(event.dataTransfer.files[0]);
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFile(input.files[0]);
        }
    }

    handleFile(file: File) {
        this.selectedFile.set(file);
        this.fileDropped.emit(file);
    }

    formatBytes(bytes: number, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}
