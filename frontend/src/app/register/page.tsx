"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser, verifyEmail, resendCode } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "model",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      setStep("verify");
      setInfo(`We sent a 6-digit code to ${form.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await verifyEmail(form.email, code);
      localStorage.setItem("token", result.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    try {
      await resendCode(form.email);
      setInfo("A new code was sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code");
    }
  }

  if (step === "verify") {
    return (
      <main className="page-enter flex min-h-screen items-center justify-center bg-bg px-6 py-16 text-ink">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="font-display text-xl tracking-[0.15em] text-ink"
          >
            FASHLINK
          </Link>

          <h1 className="mt-10 font-display text-3xl text-ink">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-muted">{info}</p>

          <form onSubmit={handleVerify} className="mt-8 space-y-4">
            <div>
              <label className="text-xs tracking-wide text-muted uppercase">
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink outline-none focus:border-gold"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-full btn-primary bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify and continue"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              className="text-gold hover:underline"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setCode("");
                setError("");
                setInfo("");
              }}
              className="text-muted hover:text-ink transition-colors"
            >
              Use a different email
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter flex min-h-screen items-center justify-center bg-bg px-6 py-16 text-ink">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="font-display text-xl tracking-[0.15em] text-ink"
        >
          FASHLINK
        </Link>

        <h1 className="mt-10 font-display text-3xl text-ink">
          Create your profile
        </h1>
        <p className="mt-2 text-sm text-muted">
          Join as a model, designer, or recruiter.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              Full name
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              Username
            </label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="janedoe"
            />
          </div>

          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>

          <RoleDropdown
            value={form.role}
            onChange={(role) => setForm({ ...form, role })}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full btn-primary bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}


function RoleDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = [
    { value: "model", label: "Model" },
    { value: "designer", label: "Designer" },
    { value: "recruiter", label: "Recruiter" },
  ];
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="text-xs tracking-wide text-muted uppercase">I am a</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-2 flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold hover:border-gold/50"
      >
        <span>{selected?.label}</span>
        <svg
          className={`h-4 w-4 text-gold transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                o.value === value
                  ? "bg-gold/10 text-gold"
                  : "text-ink hover:bg-bg hover:text-gold"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
