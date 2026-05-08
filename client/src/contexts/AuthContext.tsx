import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { KEYS, readKey, subscribe, writeKey } from "@/lib/storage";
import type { Role, User } from "@/lib/types";
import { ensureSeeded } from "@/lib/seed";
import { toast } from "sonner";

interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  shopName?: string;
}

interface AuthContextValue {
  user: User | null;
  users: User[];
  loading: boolean;

  signup: (input: SignupInput) => User | null;
  loginWithCredentials: (email: string, password: string) => User | null;
  login: (userId: string) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  resetPassword: (email: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getUsers(): User[] {
  return readKey<User[]>(KEYS.users, []);
}
function setUsersStore(list: User[]) {
  writeKey(KEYS.users, list);
}
function findByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const list = getUsers();
    setUsers(list);
    const sessionId = readKey<string | null>(KEYS.session, null);
    setUser(sessionId ? list.find((u) => u.id === sessionId) ?? null : null);
  }, []);

  useEffect(() => {
    ensureSeeded();
    refresh();
    setLoading(false);
    const u1 = subscribe(KEYS.session, refresh);
    const u2 = subscribe(KEYS.users, refresh);
    return () => {
      u1();
      u2();
    };
  }, [refresh]);

  const signup: AuthContextValue["signup"] = useCallback((input) => {
    const existing = findByEmail(input.email);
    if (existing) {
      toast.error("Email already registered");
      return null;
    }
    if (input.role === "vendor" && !input.shopName?.trim()) {
      toast.error("Shop name is required for vendors");
      return null;
    }
    const newUser: User = {
      id: `u-${Date.now().toString(36)}`,
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      status: "active",
      shopName: input.shopName,
      createdAt: new Date().toISOString(),
    };
    const list = getUsers();
    list.push(newUser);
    setUsersStore(list);
    writeKey(KEYS.session, newUser.id);
    toast.success(`Welcome, ${newUser.name.split(" ")[0]}!`);
    return newUser;
  }, []);

  const loginWithCredentials: AuthContextValue["loginWithCredentials"] =
    useCallback((email, password) => {
      const target = findByEmail(email);
      if (!target) {
        toast.error("No account with this email");
        return null;
      }
      if (target.password && target.password !== password) {
        toast.error("Incorrect password");
        return null;
      }
      if (target.status === "suspended") {
        toast.error(
          `Account suspended: ${target.suspensionReason ?? "Contact support."}`,
        );
        return null;
      }
      writeKey(KEYS.session, target.id);
      return target;
    }, []);

  const login = useCallback((userId: string) => {
    writeKey(KEYS.session, userId);
  }, []);

  const logout = useCallback(() => {
    writeKey(KEYS.session, null);
    setUser(null);
    toast("Signed out");
  }, []);

  const switchRole = useCallback((role: Role) => {
    const target = getUsers().find(
      (u) => u.role === role && u.status !== "suspended",
    );
    if (target) {
      writeKey(KEYS.session, target.id);
      toast.success(`Now viewing as ${role}`);
    }
  }, []);

  const resetPassword: AuthContextValue["resetPassword"] = useCallback(
    (email, newPassword) => {
      const list = getUsers();
      const i = list.findIndex(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (i < 0) return false;
      list[i] = { ...list[i], password: newPassword };
      setUsersStore(list);
      return true;
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      users,
      loading,
      signup,
      loginWithCredentials,
      login,
      logout,
      switchRole,
      resetPassword,
    }),
    [user, users, loading, signup, loginWithCredentials, login, logout, switchRole, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
