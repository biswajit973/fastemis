const state = new Map<string, string>();

export const runtimeStore = {
    setItem(key: string, value: string): void {
        state.set(key, value);
    },

    getItem(key: string): string | null {
        return state.has(key) ? state.get(key)! : null;
    },

    removeItem(key: string): void {
        state.delete(key);
    },

    clear(): void {
        state.clear();
    }
};
