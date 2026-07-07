// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';
import { useSettingsController } from './useSettingsController.js';

afterEach(() => {
  cleanup();
  storage.removeItem(storageKeys.cardPreferences);
});

describe('useSettingsController volume', () => {
  it('updates volume immediately and persists it through the shared adapter', () => {
    const { result } = renderHook(() => useSettingsController());

    expect(result.current.preferences.volume).toBe(70);

    act(() => {
      result.current.setVolume(42);
    });

    expect(result.current.preferences.volume).toBe(42);
    expect(storage.getJson(storageKeys.cardPreferences)).toEqual(
      expect.objectContaining({ volume: 42 }),
    );
  });

  it('normalizes volume to the supported 0 to 100 range', () => {
    const { result } = renderHook(() => useSettingsController());

    act(() => {
      result.current.setVolume(999);
    });
    expect(result.current.preferences.volume).toBe(100);

    act(() => {
      result.current.setVolume(-10);
    });
    expect(result.current.preferences.volume).toBe(0);
  });
});
