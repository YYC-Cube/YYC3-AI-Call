/**
 * Storage Mock for Testing
 */

export function createStorageMock(): Storage {
    const store: Record<string, string> = {};

    return {
        getItem(key: string): string | null {
            return store[key] ?? null;
        },

        setItem(key: string, value: string): void {
            store[key] = value;
        },

        removeItem(key: string): void {
            delete store[key];
        },

        clear(): void {
            Object.keys(store).forEach(key => delete store[key]);
        },

        get key(): number {
            return Object.keys(store).length;
        },

        get length(): number {
            return Object.keys(store).length;
        }
    } as unknown as Storage;
}
