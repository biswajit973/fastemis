import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LocationAccessService } from '../services/location-access.service';

export const locationAccessGuard: CanActivateFn = (_route, state) => {
    const authService = inject(AuthService);
    const locationAccessService = inject(LocationAccessService);
    const router = inject(Router);

    const currentUser = authService.currentUserSignal();
    if (!currentUser) {
        return router.createUrlTree(['/sign-in']);
    }
    if (currentUser.role !== 'user') {
        return true;
    }

    if (locationAccessService.isLocationSatisfiedForCurrentSession()) {
        return true;
    }

    return router.createUrlTree(['/dashboard/location-access'], {
        queryParams: {
            returnUrl: state.url
        }
    });
};
