import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/useAuth.js';
import Button from "../../components/Button";
import { apiUrl } from "../../config/api.js";

const inputClasses =
  "mt-2 w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";

const actionButtonClassName =
  "w-full rounded-xl py-3 text-[11px] tracking-[0.2em] bg-blue-950 text-white hover:bg-black hover:border-black";

const formatCountdown = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPrompt, setShowForgotPrompt] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    if (!retryAfterSeconds) return undefined;
    const timer = window.setInterval(() => {
      setRetryAfterSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (retryAfterSeconds === 0 && isRateLimited) {
      setError("");
      setIsRateLimited(false);
    }
  }, [retryAfterSeconds, isRateLimited]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsRateLimited(false);
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("user/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(data.retryAfterSeconds || response.headers.get("Retry-After") || 0);
          setRetryAfterSeconds(retryAfter);
          setIsRateLimited(true);
          throw new Error(
            `Too many failed login attempts (${data.failedAttempts || "multiple"}). Please wait before trying again.`,
          );
        }
        throw new Error(
          response.status === 401
            ? "Invalid username or password."
            : response.status === 403
              ? data.message || "Your account is inactive. Please contact an administrator."
            : "Unable to sign in right now. Please try again.",
        );
      }
      login(data);
      navigate(location.state?.from || "/");
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Unable to connect right now. Please try again."
          : requestError.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="border-2 border-zinc-900 bg-zinc-50 p-6 shadow-xl sm:p-8">
        <div className="border-b-2 border-zinc-900 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Account Access
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
          Sign In
          </h1>
        </div>
        <p className="mt-5 text-sm leading-6 text-zinc-600">
          Access your store account.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-blue-950">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              placeholder="user@gmail.com"
              className={inputClasses}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-blue-950">
              Password
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                placeholder="Password"
                className={`${inputClasses} mt-0 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex translate-y-px cursor-pointer items-center pr-3 text-zinc-500 transition hover:text-blue-950"
              >
                {showPassword ? (
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.3A10.7 10.7 0 0 1 12 4c5 0 8.5 4 9.5 6a16.6 16.6 0 0 1-3.2 3.9M6.2 6.2C4.5 7.4 3.4 9 2.5 10c1 2 4.5 6 9.5 6 1 0 1.9-.2 2.7-.5" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 6 12 6s9.5 6 9.5 6S18 18 12 18s-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              It must be a combination of minimum 8 letters, numbers, and
              symbols.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="h-4 w-4 accent-yellow-400" />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => navigate("/auth/forgot-password")}
              className="font-semibold text-blue-950 underline decoration-yellow-500 decoration-2 underline-offset-4 transition hover:text-yellow-600"
            >
              Forgot Password?
            </button>
          </div>

          <div className="min-h-5">
            {error && (
              <p role="alert" aria-live="polite" className="border-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
                {isRateLimited && ` Time remaining: ${formatCountdown(retryAfterSeconds)}.`}
              </p>
            )}
          </div>
          <Button type="submit" className={actionButtonClassName} disabled={isSubmitting || retryAfterSeconds > 0}>
            {isSubmitting
            ? "Logging In..."
            : "Log In"}
          </Button>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl py-3 text-[11px] tracking-[0.2em] border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-100"
            >
              Google
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl py-3 text-[11px] tracking-[0.2em] border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-100"
            >
              Apple
            </Button>
          </div>
        </form>

        <div className="mt-8 border-t-2 border-zinc-900 pt-6 text-sm text-zinc-700">
          No account yet?{" "}
          <Link
            to="/auth/signup"
            className="font-bold text-blue-950 underline decoration-yellow-500 decoration-2 underline-offset-4 hover:text-yellow-600"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 hover:text-blue-950 transition"
          >
            ← Back to Home
          </Link>
        </div>
        {showForgotPrompt && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 px-4 py-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowForgotPrompt(false);
            }}
          >
            <section
              className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-password-title"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Account action
              </p>
              <h2 id="forgot-password-title" className="mt-2 text-2xl font-bold text-blue-950">
                Sign in first to change your password
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Password changes are available inside your profile after you
                successfully sign in.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPrompt(false)}
                  className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100"
                >
                  Stay here
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPrompt(false);
                    document.querySelector("input[type='email']")?.focus();
                  }}
                  className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-black hover:bg-black"
                >
                  Continue to sign in
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInPage;
