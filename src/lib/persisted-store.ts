/**
 * A value kept in `localStorage`, shaped as an external store so React can
 * subscribe to it with `useSyncExternalStore`.
 *
 * The bag and the wishlist are not really React state: they outlive the tab,
 * and a second tab can change them behind this one's back. Modelling them as
 * an external store rather than seeding `useState` from an effect is what makes
 * the server render and the first client render agree, and what lets a bag
 * emptied in one tab empty in the other.
 */
export type PersistedStore<T> = {
  subscribe: (listener: () => void) => () => void;
  /** The live value. Cached, so React sees a stable reference between writes. */
  getSnapshot: () => T;
  /** What the server rendered, and what hydration matches against. */
  getServerSnapshot: () => T;
  /** Replace the value from the current one, and write it back. */
  update: (updater: (previous: T) => T) => void;
};

export function createPersistedStore<T>(
  key: string,
  empty: T,
  /** Drops anything the saved JSON holds that is no longer valid. */
  revive: (saved: unknown) => T,
): PersistedStore<T> {
  let snapshot = empty;
  let loaded = false;
  const listeners = new Set<() => void>();

  /*
   * Read on demand rather than at module load: this file is imported on the
   * server too, where there is no `localStorage` at all. The `loaded` flag
   * makes the read happen once, which is what keeps `getSnapshot` returning the
   * same reference on every call until something actually writes.
   */
  function current(): T {
    if (!loaded) {
      loaded = true;
      try {
        const raw = window.localStorage.getItem(key);
        snapshot = raw ? revive(JSON.parse(raw)) : empty;
      } catch {
        snapshot = empty;
      }
    }
    return snapshot;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);

      // `storage` fires in the *other* tabs, which is exactly the case a bag
      // kept in one browser needs to hear about.
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== key) return;
        loaded = false;
        current();
        listeners.forEach((l) => l());
      };
      window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },

    getSnapshot: current,

    getServerSnapshot: () => empty,

    update(updater) {
      snapshot = updater(current());
      try {
        window.localStorage.setItem(key, JSON.stringify(snapshot));
      } catch {
        /* Private browsing, or the quota is full. It still works this session. */
      }
      listeners.forEach((l) => l());
    },
  };
}

/**
 * Subscribing to nothing, so the two snapshots differ only in when they are
 * asked for: `false` while the server renders and through hydration, `true`
 * once the browser has taken over. Anything that would otherwise print an empty
 * bag for one frame waits on this.
 */
export const hydratedStore = {
  subscribe: () => () => {},
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};
