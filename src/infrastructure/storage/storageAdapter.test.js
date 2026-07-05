import { describe, expect, it } from 'vitest';
import { migrateApplicationStorage } from './migrations.js';
import { StorageAdapter } from './storageAdapter.js';
import { legacyStorageKeys, storageKeys } from './storageKeys.js';

function createBackend(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
    values,
  };
}

describe('StorageAdapter', () => {
  it('reads, writes and removes values through one interface', () => {
    const backend = createBackend();
    const adapter = new StorageAdapter(() => backend);

    expect(adapter.setItem('key', 'value')).toBe(true);
    expect(adapter.getItem('key')).toBe('value');
    expect(adapter.removeItem('key')).toBe(true);
    expect(adapter.getItem('key')).toBeNull();
  });

  it('keeps runtime state when browser storage throws', () => {
    const adapter = new StorageAdapter(() => ({
      getItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    }));

    expect(adapter.setItem('key', 'fallback')).toBe(false);
    expect(adapter.getItem('key')).toBe('fallback');
    expect(adapter.getJson('invalid', { safe: true })).toEqual({ safe: true });
  });

  it('migrates legacy token and theme without data loss', () => {
    const backend = createBackend({
      [legacyStorageKeys.authToken]: 'token',
      [legacyStorageKeys.theme]: 'light',
    });
    const adapter = new StorageAdapter(() => backend);

    migrateApplicationStorage(adapter);

    expect(backend.values.get(storageKeys.authToken)).toBe('token');
    expect(backend.values.get(storageKeys.theme)).toBe('light');
    expect(backend.values.has(legacyStorageKeys.authToken)).toBe(false);
    expect(backend.values.has(legacyStorageKeys.theme)).toBe(false);
  });

  it('does not overwrite canonical data during migration', () => {
    const backend = createBackend({
      [legacyStorageKeys.authToken]: 'old',
      [storageKeys.authToken]: 'current',
    });
    const adapter = new StorageAdapter(() => backend);

    migrateApplicationStorage(adapter);

    expect(backend.values.get(storageKeys.authToken)).toBe('current');
    expect(backend.values.get(legacyStorageKeys.authToken)).toBe('old');
  });
});
