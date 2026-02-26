import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notification = inject(NotificationService);
    const auth = inject(AuthService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unknown error occurred!';
            const isAuthEntryRequest = /\/api\/(login|signup|register)\/?$/.test(req.url)
                || /\/api\/agent\/(login|access)\/?$/.test(req.url);

            if (error.error instanceof ErrorEvent) {
                // Client-side
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Server-side
                if (error.status === 401) {
                    if (isAuthEntryRequest) {
                        errorMessage = error.error?.error || error.error?.detail || 'Invalid credentials.';
                    } else {
                        auth.logout();
                        router.navigate(['/sign-in']);
                        errorMessage = 'Session expired. Please log in again.';
                    }
                } else if (error.error && error.error.message) {
                    errorMessage = error.error.message;
                } else {
                    errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
                }
            }

            notification.error(errorMessage);
            return throwError(() => new Error(errorMessage));
        })
    );
};
