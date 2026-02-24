import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Tip for integrating Django REST Framework (DRF):
// 1. DRF usually returns paginated objects in this format: { count: number, next: string, previous: string, results: T[] }
// 2. We use HttpClient directly from Angular to perform standard GET/POST/PATCH/DELETE requests.

export interface DogBreed {
    id: string;
    type: string;
    attributes: {
        name: string;
        description: string;
        life: { max: number, min: number };
        male_weight: { max: number, min: number };
        female_weight: { max: number, min: number };
        hypoallergenic: boolean;
    };
}

export interface DogApiResponse {
    data: DogBreed[];
    links: {
        self: string;
        current: string;
        next: string;
        last: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DogApiService {
    // Using dogapi.dog as requested
    private readonly baseUrl = 'https://dogapi.dog/api/v2';

    constructor(private http: HttpClient) { }

    /**
     * Example GET request to fetch a list of objects exactly like a DRF ListAPIView.
     */
    getBreeds(): Observable<DogApiResponse> {
        // When calling your Django API, it would look like this:
        // return this.http.get<DjangoResponse>('https://your-domain.com/api/v1/models/');
        return this.http.get<DogApiResponse>(`${this.baseUrl}/breeds`);
    }
}
