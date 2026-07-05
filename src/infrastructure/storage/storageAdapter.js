export class StorageAdapter {
  #backendFactory;
  #memory = new Map();

  constructor(backendFactory = () => globalThis.localStorage) {
    this.#backendFactory = backendFactory;
  }

  #backend() {
    try {
      return this.#backendFactory?.() || null;
    } catch {
      return null;
    }
  }

  getItem(key) {
    try {
      const value = this.#backend()?.getItem(String(key));

      if (value !== null && value !== undefined) {
        this.#memory.set(String(key), value);
        return value;
      }
    } catch {
      // The in-memory fallback keeps the application operational.
    }

    return this.#memory.get(String(key)) ?? null;
  }

  setItem(key, value) {
    const normalizedKey = String(key);
    const normalizedValue = String(value);
    this.#memory.set(normalizedKey, normalizedValue);

    try {
      const backend = this.#backend();
      if (!backend) return false;
      backend.setItem(normalizedKey, normalizedValue);
      return true;
    } catch {
      return false;
    }
  }

  removeItem(key) {
    const normalizedKey = String(key);
    this.#memory.delete(normalizedKey);

    try {
      const backend = this.#backend();
      if (!backend) return false;
      backend.removeItem(normalizedKey);
      return true;
    } catch {
      return false;
    }
  }

  getJson(key, fallback = null) {
    const value = this.getItem(key);
    if (value === null) return fallback;

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  setJson(key, value) {
    return this.setItem(key, JSON.stringify(value));
  }

  migrate({ from, map = (value) => value, to }) {
    if (this.getItem(to) !== null) return false;

    const legacyValue = this.getItem(from);
    if (legacyValue === null) return false;

    const persisted = this.setItem(to, map(legacyValue));
    if (persisted) this.removeItem(from);
    return true;
  }
}

export const storage = new StorageAdapter();
