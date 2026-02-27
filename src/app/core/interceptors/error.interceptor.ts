import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

const isHtmlPayload = (value: string): boolean => {
    const input = String(value || '').trim().toLowerCase();
    if (!input) return false;
    return input.includes('<!doctype html')
        || input.includes('<html')
        || /<[^>]+>/.test(input);
};

const normalizeErrorText = (value: unknown): string => {
    const text = String(value ?? '').trim();
    if (!text || isHtmlPayload(text)) {
        return '';
    }
    return text.replace(/\s+/g, ' ').trim();
};

const genericHttpError = (status: number): string => {
    if (status === 404) return 'Requested resource was not found.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status >= 500) return 'Server error. Please try again in a moment.';
    return `Request failed (HTTP ${status || 0}).`;
};

const shouldSuppressErrorToast = (reqUrl: string, status: number): boolean => {
    // /api/partners 404 is expected in current flow; service falls back to local JSON.
    if (status === 404 && /\/api\/partners\/?$/.test(reqUrl)) {
        return true;
    }
    return false;
};

const formatServerError = (error: HttpErrorResponse): string => {
    const payload = error.error;

    if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;

        const directMessage = [record['message'], record['detail'], record['error']]
            .map(normalizeErrorText)
            .find((value) => !!value);
        if (directMessage) {
            return directMessage;
        }

        const entries = Object.entries(record);
        if (entries.length > 0) {
            const [key, value] = entries[0];
            const prefix = key && !['message', 'detail', 'error', 'non_field_errors'].includes(key)
                ? `${key}: `
                : '';

            if (Array.isArray(value) && value.length > 0) {
                const firstMessage = normalizeErrorText(value[0]);
                if (firstMessage) {
                    return `${prefix}${firstMessage}`.trim();
                }
            }
            const rawValueMessage = normalizeErrorText(value);
            if (rawValueMessage) {
                return `${prefix}${rawValueMessage}`.trim();
            }
        }
    }

    if (typeof payload === 'string') {
        const payloadMessage = normalizeErrorText(payload);
        if (payloadMessage) {
            return payloadMessage;
        }
    }

    const safeHttpMessage = normalizeErrorText(error.message);
    return safeHttpMessage || genericHttpError(error.status);
};

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
                        const currentRole = auth.currentUserSignal()?.role;
                        const signInRoute = currentRole === 'vendor' ? '/agent-sign-in' : '/sign-in';
                        auth.logout();
                        router.navigate([signInRoute]);
                        errorMessage = 'Session expired. Please log in again.';
                    }
                } else {
                    errorMessage = formatServerError(error);
                }
            }

            if (!shouldSuppressErrorToast(req.url, error.status)) {
                notification.error(errorMessage);
            }
            return throwError(() => error);
        })
    );
};
