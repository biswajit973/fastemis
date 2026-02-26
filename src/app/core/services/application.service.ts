import { Injectable, signal } from '@angular/core';
import { Application, ApplicationStatus, NEXT_STATUS } from '../models/application.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { runtimeStore } from '../utils/runtime-store';

@Injectable({
    providedIn: 'root'
})
export class ApplicationService {
    // Simulate an application ID
    public currentApplicationId = signal<string | null>(null);
    public currentApplicationStatus = signal<ApplicationStatus | null>(null);
    public currentApplication = signal<Application | null>(null);

    constructor() {
        // Attempt load from runtime store (if navigating between routes)
        const storedApp = runtimeStore.getItem('active_app');
        if (storedApp) {
            try {
                const app: Application = JSON.parse(storedApp);
                this.setApplication(app);
            } catch (e) { }
        }
    }

    setApplication(app: Application) {
        this.currentApplicationId.set(app.id);
        this.currentApplicationStatus.set(app.status);
        this.currentApplication.set(app);
        runtimeStore.setItem('active_app', JSON.stringify(app));
    }

    clearApplication() {
        this.currentApplicationId.set(null);
        this.currentApplicationStatus.set(null);
        this.currentApplication.set(null);
        runtimeStore.removeItem('active_app');
    }

    updateStatus(newStatus: ApplicationStatus) {
        const app = this.currentApplication();
        if (app) {
            app.status = newStatus;
            app.updatedAt = new Date().toISOString();
            this.setApplication(app);
        }
    }

    progressToNextStatus() {
        const currentStatus = this.currentApplicationStatus();
        if (currentStatus && NEXT_STATUS[currentStatus]) {
            this.updateStatus(NEXT_STATUS[currentStatus]!);
        }
    }

    progressApplicationState() {
        this.progressToNextStatus();
    }

    submitApplication(data: any): Observable<Application> {
        // Mock submission
        const app: Application = {
            id: 'APP-' + Math.floor(Math.random() * 10000),
            partnerId: data.partnerId,
            status: ApplicationStatus.NEW_UNPAID,
            requestedAmount: data.requestedAmount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.setApplication(app);
        return of(app);
    }
}
