import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingBag,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { Role, User } from "@/lib/types";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Mode = "login" | "signup" | "forgot";

type PendingAction =
  | { kind: "login"; email: string; password: string; otp: string }
  | {
      kind: "signup";
      data: {
        name: string;
        email: string;
        password: string;
        role: Role;
        shopName?: string;
      };
      otp: string;
    }
  | { kind: "reset"; email: string; otp: string }
  | null;

const DEMO_CREDS = [
  { role: "Admin", email: "kr.tarun.8873@gmail.com", password: "123456789" },
  { role: "Vendor", email: "tarunmotov@gmail.com", password: "123456789" },
  {
    role: "Customer",
    email: "tarun230519@arkajainuniversity.ac.in",
    password: "123456789",
  },
];

/**
 * Calls the backend /api/send-otp endpoint.
 * Returns the OTP string on success (backend echoes it back for demo purposes),
 * or throws an error so callers can handle it.
 */
async function sendOtpViaBackend(
  email: string,
  userName: string,
  type: string,
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, userName, type }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to send OTP");
  }

  // Backend returns the OTP in `data.otp` (demo mode — remove in production)
  return String(data.otp);
}

export default function Auth({ mode: initialMode = "login" }: { mode?: Mode }) {
  const { signup, loginWithCredentials, resetPassword, users } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = (params.get("role") as Role) || "customer";

  const [mode, setMode] = useState<Exclude<Mode, "forgot">>(
    initialMode === "signup" ? "signup" : "login",
  );
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    role: initialRole as Role,
    shopName: "",
  });

  const [pending, setPending] = useState<PendingAction>(null);
  const [otpInput, setOtpInput] = useState("");

  const [forgotOpen, setForgotOpen] = useState(initialMode === "forgot");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [newPwd, setNewPwd] = useState({ p1: "", p2: "" });

  useEffect(() => {
    if (initialMode === "forgot") setForgotOpen(true);
  }, [initialMode]);

  const routeFor = (u: User) => {
    if (u.role === "vendor") navigate("/vendor", { replace: true });
    else if (u.role === "admin") navigate("/admin", { replace: true });
    else navigate("/", { replace: true });
  };

  // ---- Login flow ----
  const startLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error("Email and password required");
      return;
    }
    const target = users.find(
      (u) => u.email.toLowerCase() === loginForm.email.toLowerCase(),
    );
    if (!target) {
      toast.error("No account with this email");
      return;
    }
    if (target.password && target.password !== loginForm.password) {
      toast.error("Incorrect password");
      return;
    }

    setIsLoading(true);
    try {
      const otp = await sendOtpViaBackend(
        loginForm.email,
        target.name,
        "Login",
      );
      toast.success(`Verification code sent to ${loginForm.email}`, {
        description: "Check your inbox — valid for 10 minutes.",
        duration: 8000,
      });
      setPending({
        kind: "login",
        email: loginForm.email,
        password: loginForm.password,
        otp,
      });
      setOtpInput("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Signup flow ----
  const startSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (signupForm.role === "vendor" && !signupForm.shopName.trim()) {
      toast.error("Shop name is required for vendors");
      return;
    }
    if (
      users.some(
        (u) => u.email.toLowerCase() === signupForm.email.toLowerCase(),
      )
    ) {
      toast.error("Email already registered");
      return;
    }

    setIsLoading(true);
    try {
      const otp = await sendOtpViaBackend(
        signupForm.email,
        signupForm.name,
        "Account Creation",
      );
      toast.success(`Verification code sent to ${signupForm.email}`, {
        description: "Check your inbox — valid for 10 minutes.",
        duration: 8000,
      });
      setPending({ kind: "signup", data: { ...signupForm }, otp });
      setOtpInput("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Forgot flow ----
  const startForgot = async () => {
    if (!forgotEmail) {
      toast.error("Enter your email");
      return;
    }
    const target = users.find(
      (u) => u.email.toLowerCase() === forgotEmail.toLowerCase(),
    );
    if (!target) {
      toast.error("No account with that email");
      return;
    }

    setIsLoading(true);
    try {
      const otp = await sendOtpViaBackend(
        forgotEmail,
        target.name,
        "Password Reset",
      );
      toast.success(`Reset code sent to ${forgotEmail}`, {
        description: "Check your inbox — valid for 10 minutes.",
        duration: 8000,
      });
      setPending({ kind: "reset", email: forgotEmail, otp });
      setForgotOpen(false);
      setOtpInput("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Resend OTP ----
  const resendOtp = async () => {
    if (!pending) return;
    const email = "email" in pending ? pending.email : pending.data.email;
    const userName =
      pending.kind === "signup"
        ? pending.data.name
        : (users.find((u) => u.email.toLowerCase() === email.toLowerCase())
            ?.name ?? "User");
    const typeMap = {
      login: "Login",
      signup: "Account Creation",
      reset: "Password Reset",
    } as const;

    setIsLoading(true);
    try {
      const otp = await sendOtpViaBackend(
        email,
        userName,
        typeMap[pending.kind],
      );
      toast.success("New code sent — check your inbox");
      // Update stored OTP
      if (pending.kind === "login") {
        setPending({ ...pending, otp });
      } else if (pending.kind === "signup") {
        setPending({ ...pending, otp });
      } else {
        setPending({ ...pending, otp });
      }
      setOtpInput("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- OTP confirm ----
  const confirmOtp = () => {
    if (!pending) return;
    if (otpInput !== pending.otp) {
      toast.error("Incorrect code — please try again");
      return;
    }
    if (pending.kind === "login") {
      const u = loginWithCredentials(pending.email, pending.password);
      if (u) {
        toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
        setPending(null);
        routeFor(u);
      }
    } else if (pending.kind === "signup") {
      const u = signup(pending.data);
      if (u) {
        setPending(null);
        routeFor(u);
      }
    } else if (pending.kind === "reset") {
      setResetOpen(true);
    }
  };

  const submitNewPwd = () => {
    if (pending?.kind !== "reset") return;
    if (newPwd.p1.length < 6) {
      toast.error("Min 6 characters");
      return;
    }
    if (newPwd.p1 !== newPwd.p2) {
      toast.error("Passwords don't match");
      return;
    }
    if (resetPassword(pending.email, newPwd.p1)) {
      toast.success("Password updated — please sign in");
      setResetOpen(false);
      setPending(null);
      setNewPwd({ p1: "", p2: "" });
      setMode("login");
      navigate("/auth/login", { replace: true });
    }
  };

  // Derive the masked email for display
  const pendingEmail =
    pending && "email" in pending
      ? pending.email
      : pending && "data" in pending
        ? pending.data.email
        : "";

  return (
    <div className="container max-w-md py-10 sm:py-14">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-sunset text-primary-foreground shadow-glow">
          <ShoppingBag className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Welcome to ShopEasy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Burnt Sunset marketplace.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "login" | "signup")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          {/* ---- Login tab ---- */}
          <TabsContent value="login" className="mt-5">
            <form onSubmit={startLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                    className="pl-9"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-pwd">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginForm.email);
                      setForgotOpen(true);
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-pwd"
                    type={showPwd ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password visibility"
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* ---- Signup tab ---- */}
          <TabsContent value="signup" className="mt-5">
            <form onSubmit={startSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Full name</Label>
                <Input
                  id="su-name"
                  value={signupForm.name}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  value={signupForm.email}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-pwd">Password</Label>
                <Input
                  id="su-pwd"
                  type="password"
                  value={signupForm.password}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, password: e.target.value })
                  }
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-role">Account type</Label>
                <select
                  id="su-role"
                  value={signupForm.role}
                  onChange={(e) =>
                    setSignupForm({
                      ...signupForm,
                      role: e.target.value as Role,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              {signupForm.role === "vendor" && (
                <div className="space-y-1.5">
                  <Label htmlFor="su-shop">Shop name</Label>
                  <Input
                    id="su-shop"
                    value={signupForm.shopName}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        shopName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---- Demo accounts ---- */}
      <div className="mt-8 rounded-2xl border bg-accent/40 p-5">
        <h3 className="text-sm font-semibold">Quick Login (Demo)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Click a row to autofill credentials, then sign in to receive a real
          OTP email.
        </p>
        <div className="mt-3 grid gap-2">
          {DEMO_CREDS.map((c) => (
            <button
              key={c.email}
              type="button"
              onClick={() => {
                setMode("login");
                setLoginForm({ email: c.email, password: c.password });
              }}
              className="w-full rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{c.role}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {c.password}
                </span>
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {c.email}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ---- OTP Verify Dialog ---- */}
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Verify Email
            </DialogTitle>
            <DialogDescription>
              A 6-digit code was sent to{" "}
              <span className="font-medium text-foreground">
                {pendingEmail}
              </span>
              . Check your inbox (and spam folder).
            </DialogDescription>
          </DialogHeader>

          <Input
            value={otpInput}
            onChange={(e) =>
              setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            maxLength={6}
            className="mt-1.5 text-center font-mono text-xl tracking-[0.3em]"
            placeholder="••••••"
            autoFocus
          />

          <p className="text-center text-xs text-muted-foreground">
            Didn't receive it?{" "}
            <button
              type="button"
              onClick={resendOtp}
              disabled={isLoading}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {isLoading ? "Sending…" : "Resend code"}
            </button>
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmOtp}
              disabled={otpInput.length !== 6 || isLoading}
            >
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Forgot Password Dialog ---- */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Reset Password
            </DialogTitle>
            <DialogDescription>
              Enter your email to receive a reset code.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)}>
              Cancel
            </Button>
            <Button onClick={startForgot} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send Code"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- New Password Dialog ---- */}
      <Dialog
        open={resetOpen}
        onOpenChange={(o) => {
          setResetOpen(o);
          if (!o) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set new password</DialogTitle>
            <DialogDescription>
              For {pending?.kind === "reset" ? pending.email : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPwd.p1}
              onChange={(e) => setNewPwd({ ...newPwd, p1: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Confirm password"
              value={newPwd.p2}
              onChange={(e) => setNewPwd({ ...newPwd, p2: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button onClick={submitNewPwd}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
