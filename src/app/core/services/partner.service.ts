import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Partner } from '../models/partner.model';
import { Observable, tap, map, of, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class PartnerService {
    private api = inject(ApiService);
    private http = inject(HttpClient);

    public partners = signal<Partner[]>([]);
    public activePartner = signal<Partner | null>(null);

    constructor() { }

    loadAllPartners(): Observable<Partner[]> {
        if (this.partners().length > 0) {
            return of(this.partners());
        }

        // Fallback to local json for mock api
        return this.api.get<Partner[]>('/partners').pipe(
            catchError(() => {
                console.log('Falling back to static JSON via HttpClient');
                // Use a cache-buster so the browser doesn't return the old 404 cached response
                return this.http.get<Partner[]>('/assets/data/partners.json?v=' + Date.now());
            }),
            tap(data => this.partners.set(data))
        );
    }

    getPartnerBySlug(slug: string): Observable<Partner | undefined> {
        return this.loadAllPartners().pipe(
            map(partners => partners.find(p => p.slug === slug)),
            tap(partner => {
                if (partner) {
                    this.activePartner.set(partner);
                    this.applyPartnerTheme(partner);
                }
            })
        );
    }

    applyPartnerTheme(partner: Partner) {
        if (partner.color) {
            // For this prototype, we'll set a CSS variable on the body/root for partner-specific theme
            document.documentElement.style.setProperty('--partner-color', partner.color);
        }
    }

    clearActivePartner() {
        this.activePartner.set(null);
        document.documentElement.style.removeProperty('--partner-color');
    }
}
