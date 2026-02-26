import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const isAuthEntryRequest =
        /\/api\/(login|signup|register)\/?$/.test(req.url)
        || /\/api\/agent\/(login|access)\/?$/.test(req.url);

    // Do not attach stale/invalid JWT on authentication entry calls.
    if (isAuthEntryRequest) {
        return next(req);
    }

    const storage = inject(StorageService);
    const token = storage.getCookie('jwt_token') || storage.getSessionToken();

    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }

    return next(req);
};
