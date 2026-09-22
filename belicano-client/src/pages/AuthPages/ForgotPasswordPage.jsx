import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { apiUrl } from "../../config/api.js";

const inputClasses =
  "mt-2 w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleFields, setVisibleFields] = useState({});

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));
  const toggleVisibility = (field) =>
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (!form.newPassword) {
      setError("New password is required.");
      return;
    }
    if (!passwordPattern.test(form.newPassword)) {
      setError("New password must be at least 8 characters with letters, numbers, and symbols.");
      return;
    }
    if (!form.confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("user/forgot-password"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to change your password.");
      setForm({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(`${data.message} You can now sign in with your new password.`);
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
    <div className="border-2 border-zinc-900 bg-zinc-50 p-6 shadow-xl sm:p-8">
      <div className="border-b-2 border-zinc-900 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Account Recovery
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
          Forgot Password
        </h1>
      </div>
      <p className="mt-5 text-sm leading-6 text-zinc-600">
        Verify your email and current password, then choose a new password.
      </p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {[
          ["email", "Email Address", "email", "user@gmail.com"],
          ["currentPassword", "Current Password", "password", "Current password"],
          ["newPassword", "New Password", "password", "New password"],
          ["confirmPassword", "Confirm New Password", "password", "Confirm new password"],
        ].map(([field, label, type, placeholder]) => (
          <div key={field}>
            <label className="text-sm font-medium text-blue-950" htmlFor={field}>{label}</label>
            <div className="relative mt-2">
              <input
                id={field}
                type={type === "password" && visibleFields[field] ? "text" : type}
                value={form[field]}
                onChange={updateField(field)}
                className={`${inputClasses} ${type === "password" ? "mt-0 pr-16" : "mt-0"}`}
                placeholder={placeholder}
                autoComplete={field === "email" ? "email" : field === "currentPassword" ? "current-password" : "new-password"}
                required
              />
              {type === "password" && (
                <button
                  type="button"
                  onClick={() => toggleVisibility(field)}
                  aria-label={visibleFields[field] ? `Hide ${label}` : `Show ${label}`}
                  title={visibleFields[field] ? `Hide ${label}` : `Show ${label}`}
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-xs font-semibold text-zinc-500 transition hover:text-blue-950"
                >
                  {visibleFields[field] ? "Hide" : "Show"}
                </button>
              )}
            </div>
          </div>
        ))}
        <p className="text-xs leading-5 text-gray-500">
          Your new password must be at least 8 characters and include letters, numbers, and symbols.
        </p>
        {error && <p role="alert" className="border-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="border-2 border-green-700 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}
        <Button type="submit" className="w-full rounded-xl bg-blue-950 py-3 text-[11px] tracking-[0.2em] text-white hover:bg-black" disabled={isSubmitting}>
          {isSubmitting ? "Updating Password..." : "Update Password"}
        </Button>
      </form>
      <div className="mt-8 border-t-2 border-zinc-900 pt-6 text-sm text-zinc-700">
        Remembered your password?{" "}
        <Link to="/auth/signin" className="font-bold text-blue-950 underline decoration-yellow-500 decoration-2 underline-offset-4 hover:text-yellow-600">
          Sign In
        </Link>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 hover:text-blue-950">
          Back
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
