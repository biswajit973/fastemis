import { Injectable } from '@angular/core';
import { runtimeStore } from '../utils/runtime-store';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private sessionToken: string | null = null;

    constructor() { }

    setItem(key: string, value: any): void {
        try {
            runtimeStore.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to runtimeStore', e);
        }
    }

    getItem<T>(key: string): T | null {
        try {
            const item = runtimeStore.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            return null;
        }
    }

    removeItem(key: string): void {
        runtimeStore.removeItem(key);
    }

    clear(): void {
        runtimeStore.clear();
    }

    setSessionToken(token: string | null): void {
        this.sessionToken = token;
    }

    getSessionToken(): string | null {
        return this.sessionToken;
    }

    // Basic cookie wrappers for JWT
    setCookie(name: string, value: string, days: number = 7): void {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
    }

    getCookie(name: string): string | null {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    eraseCookie(name: string): void {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
}
