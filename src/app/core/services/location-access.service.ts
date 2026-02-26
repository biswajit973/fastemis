import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

interface CaptureLocationResponse {
    message?: string;
    location?: {
        latitude?: number | null;
        longitude?: number | null;
        accuracy_m?: number | null;
        captured_at?: string | null;
        maps_url?: string;
    };
}

interface LocationSessionMarker {
    fingerprint: string;
    capturedAt: number;
}

@Injectable({
    providedIn: 'root'
})
export class LocationAccessService {
    private readonly SESSION_KEY = 'fastemis_location_gate_v1';
    private readonly requestingState = signal<boolean>(false);
    private readonly errorState = signal<string>('');

    readonly requesting = this.requestingState.asReadonly();
    readonly error = this.errorState.asReadonly();

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    isLocationSatisfiedForCurrentSession(): boolean {
        const user = this.authService.currentUserSignal();
        if (!user || user.role !== 'user') {
            return true;
        }

        const marker = this.readMarker();
        if (!marker) {
            return false;
        }
        return marker.fingerprint === this.buildFingerprint();
    }

    captureCurrentLocation(): Observable<{ success: boolean; message?: string }> {
        this.requestingState.set(true);
        this.errorState.set('');

        return this.getBrowserPosition().pipe(
            switchMap((position) => this.http.post<CaptureLocationResponse>('/api/location/capture', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy_m: position.coords.accuracy
            })),
            map((response) => {
                this.writeMarker({
                    fingerprint: this.buildFingerprint(),
                    capturedAt: Date.now()
                });
                return {
                    success: true,
                    message: response?.message || 'Location captured successfully.'
                };
            }),
            catchError((error) => {
                const message = this.resolveLocationError(error);
                this.errorState.set(message);
                return of({
                    success: false,
                    message
                });
            }),
            finalize(() => this.requestingState.set(false))
        );
    }

    private getBrowserPosition(): Observable<GeolocationPosition> {
        return new Observable<GeolocationPosition>((observer) => {
            if (!navigator?.geolocation) {
                observer.error({ code: 'UNSUPPORTED' });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    observer.next(position);
                    observer.complete();
                },
                (error) => observer.error(error),
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0
                }
            );
        });
    }

    private resolveLocationError(error: any): string {
        if (error?.code === 'UNSUPPORTED') {
            return 'Location service is not supported on this device/browser.';
        }

        if (typeof error?.code === 'number') {
            if (error.code === 1) {
                return 'Location permission denied. Please allow location to access the website.';
            }
            if (error.code === 2) {
                return 'Unable to detect location. Please enable GPS/Wi-Fi and try again.';
            }
            if (error.code === 3) {
                return 'Location request timed out. Please try again.';
            }
        }

        const backendError = error?.error;
        if (backendError?.error) {
            return String(backendError.error);
        }
        if (typeof backendError === 'object') {
            const key = Object.keys(backendError)[0];
            if (key) {
                const value = backendError[key];
                if (Array.isArray(value) && value.length > 0) {
                    return String(value[0]);
                }
                if (value) {
                    return String(value);
                }
            }
        }
        return 'Unable to verify location right now. Please try again.';
    }

    private buildFingerprint(): string {
        const user = this.authService.currentUserSignal();
        if (!user) {
            return '';
        }
        return `${user.id}:${user.lastLoginAt || ''}`;
    }

    private readMarker(): LocationSessionMarker | null {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            const raw = sessionStorage.getItem(this.SESSION_KEY);
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw) as LocationSessionMarker;
            if (!parsed || typeof parsed.fingerprint !== 'string') {
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }

    private writeMarker(marker: LocationSessionMarker): void {
        if (typeof window === 'undefined') {
            return;
        }
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(marker));
    }
}
