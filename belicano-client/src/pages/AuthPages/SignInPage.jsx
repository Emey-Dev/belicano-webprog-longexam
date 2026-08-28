import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/useAuth.js';
import Button from "../../components/Button";
import { apiUrl } from "../../config/api.js";

const inputClasses =
  "mt-2 w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";

const actionButtonClassName =
  "w-full rounded-xl py-3 text-[11px] tracking-[0.2em] bg-blue-950 text-white hover:bg-black hover:border-black";

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("user/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
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
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              placeholder="Password"
              className={inputClasses}
            />
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
              className="font-semibold text-blue-950 underline decoration-yellow-500 decoration-2 underline-offset-4 transition hover:text-yellow-600"
            >
              Forgot Password?
            </button>
          </div>

          {error && <p role="alert" className="border-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" className={actionButtonClassName} disabled={isSubmitting}>
            {isSubmitting ? "Logging In..." : "Log In"}
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
      </div>
    </div>
  );
};

export default SignInPage;
