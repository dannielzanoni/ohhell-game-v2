import { storage } from './storageAdapter.js';
import { legacyStorageKeys, storageKeys } from './storageKeys.js';

export function migrateApplicationStorage(adapter = storage) {
  adapter.migrate({
    from: legacyStorageKeys.authToken,
    to: storageKeys.authToken,
  });
  adapter.migrate({
    from: legacyStorageKeys.theme,
    to: storageKeys.theme,
  });
}
