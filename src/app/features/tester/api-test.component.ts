import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DogApiService, DogBreed } from '../../core/services/dog-api.service';

@Component({
    selector: 'app-api-test',
    standalone: true,
    imports: [CommonModule, HttpClientModule, RouterLink],
    template: `
    <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <a routerLink="/tester" class="text-sm px-3 py-1.5 rounded-lg border border-border bg-surface text-secondary hover:text-primary transition-colors">
            ← Back to Tester Hub
          </a>
          <h1 class="text-2xl md:text-3xl font-bold text-primary">API Integration Test</h1>
        </div>
        <p class="text-secondary">
          This page demonstrates how to connect this Angular 18 Architecture to an external Django REST Framework (DRF) or any standard REST API.
          We are fetching real data from: <code class="bg-surface-2 px-1 rounded text-accent">https://dogapi.dog/api/v2/breeds</code>
        </p>
      </div>

      <div class="bg-surface border border-border rounded-xl shadow-sm p-6 max-w-3xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-primary">Dog Breeds (Live API Call)</h2>
          <button 
            (click)="fetchData()" 
            [disabled]="loading()"
            class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50 transition-colors">
            {{ loading() ? 'Fetching...' : 'Refresh Data' }}
          </button>
        </div>

        <div *ngIf="error()" class="bg-error/10 border border-error/50 rounded-lg p-4 mb-4">
          <p class="text-error text-sm font-medium">Failed to fetch data:</p>
          <pre class="text-xs text-error mt-1 whitespace-pre-wrap">{{ error() }}</pre>
        </div>

        <div *ngIf="loading() && !data().length" class="space-y-4">
          <div *ngFor="let _ of [1,2,3,4]" class="w-full h-16 bg-surface-2 animate-pulse rounded-lg border border-border"></div>
        </div>

        <ul class="space-y-3" *ngIf="data().length > 0">
          <li *ngFor="let item of data()" class="flex flex-col bg-surface-2 border border-border rounded-lg p-4 transition-colors hover:border-primary/30">
            <div class="flex justify-between items-start">
              <h3 class="font-bold text-primary">{{ item.attributes.name }}</h3>
              <span class="text-xs font-mono bg-surface-3 px-2 py-0.5 rounded text-secondary shadow-sm">ID: {{ item.id | slice:0:8 }}...</span>
            </div>
            <p class="text-sm text-secondary mt-1 line-clamp-2 leading-relaxed">{{ item.attributes.description }}</p>
            
            <div class="mt-3 flex flex-wrap gap-2 text-xs">
              <span class="px-2 py-1 rounded bg-surface border border-border text-primary font-medium">
                Life: {{ item.attributes.life.min }} - {{ item.attributes.life.max }} yrs
              </span>
              <span *ngIf="item.attributes.hypoallergenic" class="px-2 py-1 rounded bg-success/10 border border-success/20 text-success font-medium">
                Hypoallergenic
              </span>
            </div>
          </li>
        </ul>

      </div>

      <section class="mt-8 bg-surface-2 border border-border rounded-xl p-6 max-w-3xl">
        <h3 class="font-bold text-primary mb-3">Connecting to Django REST Framework (DRF) Checklist:</h3>
        <ol class="list-decimal pl-5 space-y-2 text-sm text-secondary">
          <li>Ensure <code class="text-accent bg-surface px-1">CORS_ALLOWED_ORIGINS</code> in Django's <code>settings.py</code> includes <code class="text-primary bg-surface px-1">http://localhost:4200</code>.</li>
          <li>If using JSON Web Tokens (JWT) for authentication, configure Angular's <code class="text-accent bg-surface px-1">auth.interceptor.ts</code> to securely attach the token to the <code>Authorization: Bearer</code> header.</li>
          <li>Write HTTP calls using Angular's <code class="text-primary bg-surface px-1">HttpClient</code> exactly as demonstrated in <code class="text-accent bg-surface px-1">dog-api.service.ts</code>.</li>
        </ol>
      </section>

    </div>
  `
})
export class ApiTestComponent implements OnInit {
    data = signal<DogBreed[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor(private dogApiService: DogApiService) { }

    ngOnInit(): void {
        this.fetchData();
    }

    fetchData(): void {
        this.loading.set(true);
        this.error.set(null);

        this.dogApiService.getBreeds().subscribe({
            next: (response) => {
                // According to DRF / JSON-API spec, the array of objects is usually in 'data' or 'results'
                this.data.set(response.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('API Error:', err);
                // Safely extract the error message
                this.error.set(err.message || 'An unknown network error occurred. Check browser console.');
                this.loading.set(false);
            }
        });
    }
}
