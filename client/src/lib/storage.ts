// Lightweight typed localStorage wrapper with cross-tab + same-tab change events.

const PREFIX = "shopeasy:";
const EVT = "shopeasy:storage";

export const KEYS = {
  users: "users",
  products: "products",
  orders: "orders",
  reviews: "reviews",
  complaints: "complaints",
  carts: "carts", // map of customerId -> CartItem[]
  otps: "otps",
  session: "session", // current logged-in user id
  seeded: "seeded:v1",
} as const;

export function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeKey<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
  } catch (e) {
    console.error("storage write failed", key, e);
  }
}

export function removeKey(key: string): void {
  localStorage.removeItem(PREFIX + key);
  window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
}

export function subscribe(key: string, cb: () => void): () => void {
  const local = (e: Event) => {
    const ev = e as CustomEvent<{ key: string }>;
    if (ev.detail?.key === key) cb();
  };
  const cross = (e: StorageEvent) => {
    if (e.key === PREFIX + key) cb();
  };
  window.addEventListener(EVT, local);
  window.addEventListener("storage", cross);
  return () => {
    window.removeEventListener(EVT, local);
    window.removeEventListener("storage", cross);
  };
}