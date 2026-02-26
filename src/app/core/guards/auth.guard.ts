import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const isAgentRoute = state.url.startsWith('/agent');
    const targetRole = isAgentRoute ? 'vendor' : 'user';

    if (authService.isAuthenticated()) {
        const currentRole = authService.currentUserSignal()?.role;
        if (!currentRole || currentRole !== targetRole) {
            return router.createUrlTree([isAgentRoute ? '/agent-sign-in' : '/sign-in'], {
                queryParams: {
                    role: targetRole,
                    redirect: state.url
                }
            });
        }
        return true;
    }

    return router.createUrlTree([isAgentRoute ? '/agent-sign-in' : '/sign-in'], {
        queryParams: {
            role: targetRole,
            redirect: state.url
        }
    });
};
