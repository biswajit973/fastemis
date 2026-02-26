import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const profileCompletionGuard: CanActivateFn = (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const currentUser = authService.currentUserSignal();

    if (!currentUser || currentUser.role !== 'user') {
        return true;
    }

    if (state.url.startsWith('/dashboard/complete-profile')) {
        return true;
    }

    if (currentUser.profileComplete === true) {
        return true;
    }

    if (currentUser.profileComplete === false) {
        return router.createUrlTree(['/dashboard/complete-profile'], {
            queryParams: { redirect: state.url }
        });
    }

    return authService.resolveProfileCompletionState().pipe(
        map((status) => {
            if (status.complete) {
                return true;
            }
            return router.createUrlTree(['/dashboard/complete-profile'], {
                queryParams: { redirect: state.url }
            });
        }),
        catchError(() => of(router.createUrlTree(['/dashboard/complete-profile'], {
            queryParams: { redirect: state.url }
        })))
    );
};
