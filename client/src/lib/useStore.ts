import { useEffect, useState, useCallback } from "react";
import { KEYS, readKey, subscribe, writeKey } from "./storage";

export function useStore<T>(key: keyof typeof KEYS, fallback: T) {
  const fullKey = KEYS[key];
  const [value, setValue] = useState<T>(() => readKey<T>(fullKey, fallback));

  useEffect(() => {
    const unsub = subscribe(fullKey, () => {
      setValue(readKey<T>(fullKey, fallback));
    });
    // Re-read on mount in case data changed before subscription.
    setValue(readKey<T>(fullKey, fallback));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prev = readKey<T>(fullKey, fallback);
      const next =
        typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      writeKey(fullKey, next);
      setValue(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fullKey],
  );

  return [value, update] as const;
}