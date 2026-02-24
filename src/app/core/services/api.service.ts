import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    // Optional base URL, but for mock purposes we just use relative /api/
    private baseUrl = '/api';

    constructor() { }

    get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}${path}`, { params });
    }

    put<T>(path: string, body: Object = {}): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}${path}`, JSON.stringify(body), {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
    }

    post<T>(path: string, body: Object = {}): Observable<T> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        return this.http.post<T>(`${this.baseUrl}${path}`, JSON.stringify(body), { headers });
    }

    delete<T>(path: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}${path}`);
    }
}
