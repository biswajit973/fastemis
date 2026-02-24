import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PartnerService } from '../services/partner.service';
import { map, catchError, of } from 'rxjs';

export const partnerGuard: CanActivateFn = (route, state) => {
    const partnerService = inject(PartnerService);
    const router = inject(Router);
    const slug = route.paramMap.get('slug');
    const allowedServiceableSlug = 'coinvault-finance';

    if (!slug) {
        return router.createUrlTree(['/']);
    }

    // Business rule: only CoinVault is serviceable at present.
    if (slug !== allowedServiceableSlug) {
        return router.createUrlTree(['/']);
    }

    return partnerService.getPartnerBySlug(slug).pipe(
        map(partner => {
            if (partner) {
                return true;
            }
            return router.createUrlTree(['/']);
        }),
        catchError(() => of(router.createUrlTree(['/'])))
    );
};
