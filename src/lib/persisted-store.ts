/**
 * A value kept in `localStorage`, shaped as an external store so React can
 * subscribe to it with `useSyncExternalStore`.
 *
 * The bag and the wishlist are not really React state: they outlive the tab,
 * and a second tab can change them behind this one's back. Modelling them as
 * an external store rather than seeding `useState` from an effect is what makes
 * the server render and the first client render agree, and what lets a bag
 * emptied in one tab empty in the other.
 *
 * The key is not fixed for the life of the page. A bag belongs to whoever is
 * signed in, and that changes without a reload — so the store can be pointed at
 * a different key when the account changes, carrying the old value across if
 * the caller says it should be carried. See `retarget`.
 */
export type PersistedStore<T> = {
  subscribe: (listener: () => void) => () => void;
  /** The live value. Cached, so React sees a stable reference between writes. */
  getSnapshot: () => T;
  /** What the server rendered, and what hydration matches against. */
  getServerSnapshot: () => T;
  /** Replace the value from the current one, and write it back. */
  update: (updater: (previous: T) => T) => void;
  /**
   * Point the store at a different key — a different account signing in, or
   * signing out.
   *
   * Supplying `migrate` means *move*: the value under the old key is folded
   * into the value under the new one and the old key is then deleted. That is
   * right for a guest signing in, whose bag should follow them and should not
   * be left behind for the next guest on the machine. Omitting `migrate` means
   * *switch*: each key keeps whatever it held, which is right for signing out.
   */
  retarget: (key: string, migrate?: (from: T, into: T) => T) => void;
};

export function createPersistedStore<T>(
  initialKey: string,
  empty: T,
  /** Drops anything the saved JSON holds that is no longer valid. */
  revive: (saved: unknown) => T,
): PersistedStore<T> {
  let key = initialKey;
  let snapshot = empty;
  let loaded = false;
  const listeners = new Set<() => void>();

  function read(from: string): T {
    try {
      const raw = window.localStorage.getItem(from);
      return raw ? revive(JSON.parse(raw)) : empty;
    } catch {
      return empty;
    }
  }

  function write(): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      /* Private browsing, or the quota is full. It still works this session. */
    }
  }

  /*
   * Read on demand rather than at module load: this file is imported on the
   * server too, where there is no `localStorage` at all. The `loaded` flag
   * makes the read happen once, which is what keeps `getSnapshot` returning the
   * same reference on every call until something actually writes.
   */
  function current(): T {
    if (!loaded) {
      loaded = true;
      snapshot = read(key);
    }
    return snapshot;
  }

  function announce(): void {
    listeners.forEach((l) => l());
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
        announce();
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
      write();
      announce();
    },

    retarget(nextKey, migrate) {
      if (nextKey === key) return;

      const leaving = key;
      const carried = migrate ? current() : null;

      key = nextKey;
      loaded = false;
      current();

      if (migrate && carried !== null) {
        snapshot = migrate(carried, snapshot);
        write();
        // The move is only finished once the old key is gone. Leaving it would
        // hand the next guest on this machine the bag of the person who just
        // signed in with it.
        try {
          window.localStorage.removeItem(leaving);
        } catch {
          /* Nothing to do about it, and the value is safely under the new key. */
        }
      }

      announce();
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
