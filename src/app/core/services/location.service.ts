import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    /**
     * UI-only simulation for location check.
     * Only CoinVault is serviceable at the moment.
     */
    checkPartnerAvailability(partnerId: string): Observable<'available' | 'unavailable'> {
        const id = (partnerId || '').toLowerCase();
        const isCoinVault = id === '1' || id === 'coinvault-finance';
        const status: 'available' | 'unavailable' = isCoinVault ? 'available' : 'unavailable';

        // Keep a short delay so the modal animation still feels smooth.
        return of(status).pipe(delay(1400));
    }
}
