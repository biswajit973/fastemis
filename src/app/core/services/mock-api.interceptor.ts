import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationStatus } from '../models/application.model';

export const mockApiInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    if (!environment.useMockApi) {
        return next(req);
    }

    const url = req.url;

    // Fake backend resolution
    const handleUrl = () => {
        // GET /partners
        if (url.match(/\/api\/partners$/) && req.method === 'GET') {
            // By returning 404, we let the PartnerService gracefully fallback to /assets/data/partners.json
            return throwError(() => new Error('Mock backend delegates to JSON'));
        }

        // POST /auth/register
        if (url.match(/\/api\/auth\/register$/) && req.method === 'POST') {
            const body: any = req.body;
            return of(new HttpResponse({
                status: 200,
                body: {
                    id: 'USER-' + Math.floor(Math.random() * 10000),
                    fullName: body.fullName || 'Test User',
                    email: body.email,
                    mobile: body.mobile,
                    taxId: body.taxId,
                    nationalId: body.nationalId,
                    token: 'fake-jwt-token-abcd-1234'
                }
            }));
        }

        // GET /application/:id/status
        if (url.match(/\/api\/application\/.*\/status$/) && req.method === 'GET') {
            return of(new HttpResponse({ status: 200, body: { status: ApplicationStatus.AGREEMENT_DONE } }));
        }

        // Default passthrough for assets
        if (url.startsWith('/assets/')) {
            return next(req);
        }

        // Generic Mock Success for other POSTs like payment, tnc, etc.
        if (req.method === 'POST') {
            return of(new HttpResponse({ status: 200, body: { success: true } }));
        }

        return next(req);
    };

    // Add 500ms delay to simulate network
    return handleUrl().pipe(delay(500));
};
