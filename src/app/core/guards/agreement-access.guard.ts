import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const agreementAccessGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.currentUserSignal();
    if (!currentUser || currentUser.role !== 'user') {
        return router.createUrlTree(['/sign-in']);
    }

    if (typeof currentUser.agreementTabEnabled === 'boolean') {
        return currentUser.agreementTabEnabled
            ? true
            : router.createUrlTree(['/dashboard']);
    }

    return authService.getBackendUserProfile().pipe(
        map((profile) => {
            const enabled = !!profile?.agreement_tab_enabled;
            return enabled ? true : router.createUrlTree(['/dashboard']);
        }),
        catchError(() => of(router.createUrlTree(['/dashboard'])))
    );
};
