import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import Button from "../../components/Button";
import { apiUrl } from "../../config/api.js";

const inputClasses =
  "mt-2 w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";

const actionButtonClassName =
  "w-full rounded-xl py-3 text-[11px] tracking-[0.2em] bg-blue-950 text-white hover:bg-black hover:border-black";
const philippineMobilePattern = /^\+639\d{9}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const formatCountdown = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const SignUpPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    password: "",
    userRole: "customer",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  const updateField = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });
  const updateContactNumber = (event) => {
    const localNumber = event.target.value
      .replace(/\D/g, "")
      .replace(/^63/, "")
      .replace(/^0/, "")
      .slice(0, 10);
    setForm({ ...form, contactNumber: localNumber ? `+63${localNumber}` : "" });
  };
  const validateForm = () => {
    if (!form.firstName.trim() || !form.lastName.trim())
      return "First name and last name are required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Please enter a valid email address.";
    if (!philippineMobilePattern.test(form.contactNumber.trim()))
      return "Contact number must use Philippine format: +639XXXXXXXXX.";
    if (!form.address.trim()) return "Address is required.";
    if (!passwordPattern.test(form.password))
      return "Password must be at least 8 characters with letters, numbers, and symbols.";
    return "";
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsRateLimited(false);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("user/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(data.retryAfterSeconds || response.headers.get("Retry-After") || 0);
          setRetryAfterSeconds(retryAfter);
          setIsRateLimited(true);
          throw new Error(
            `Too many failed registration attempts (${data.failedAttempts || "multiple"}). Please wait before trying again.`,
          );
        }
        throw new Error(
          response.status === 400
            ? data.message || "Please check your details and try again."
            : "Unable to create your account right now. Please try again.",
        );
      }
      login(data);
      navigate("/");
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
            New account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
            Sign Up
          </h1>
        </div>
        <p className="mt-5 text-sm leading-6 text-zinc-600">
          Create a store account for faster checkout, order updates, and pickup
          details.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="w-48">
            <label className="text-sm font-medium text-blue-950">
              Account type
            </label>
            <select
              value={form.userRole}
              onChange={updateField("userRole")}
              className={inputClasses}
            >
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-blue-950">
                First Name
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={updateField("firstName")}
                required
                placeholder="First name"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-blue-950">
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={updateField("lastName")}
                required
                placeholder="Last name"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-blue-950">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={updateField("email")}
              required
              placeholder="student@email.com"
              className={inputClasses}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-blue-950">
              Contact Number
            </label>
            <div className="mt-2 flex items-center rounded-xl border-2 border-zinc-300 bg-white focus-within:border-blue-950 focus-within:ring-2 focus-within:ring-yellow-300">
              <span
                className="flex items-center gap-2 border-r border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700"
                aria-label="Philippines country code"
              >
                <span aria-hidden="true">🇵🇭</span>
                <span>+63</span>
              </span>
              <input
                type="tel"
                value={form.contactNumber.replace(/^\+63/, "")}
                onChange={updateContactNumber}
                required
                placeholder="9XXXXXXXXX"
                pattern="9\d{9}"
                title="Enter a Philippine mobile number after +63, for example 9171234567"
                className="w-full bg-transparent px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-blue-950">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={updateField("address")}
              required
              placeholder="Street, city, province"
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
                onChange={updateField("password")}
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
              Use a secure password with letters, numbers, and symbols.
            </p>
          </div>

          <div className="min-h-5">
            {error && (
              <p
                role="alert"
                aria-live="polite"
                className="border-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
                {isRateLimited && ` Time remaining: ${formatCountdown(retryAfterSeconds)}.`}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className={actionButtonClassName}
            disabled={isSubmitting || retryAfterSeconds > 0}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
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
          Already have an account?{" "}
          <Link
            to="/auth/signin"
            className="font-bold text-blue-950 underline decoration-yellow-500 decoration-2 underline-offset-4 hover:text-yellow-600"
          >
            Sign In
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

export default SignUpPage;
