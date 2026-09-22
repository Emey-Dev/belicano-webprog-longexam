import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { apiUrl } from "../../config/api.js";
import { useAuth } from "../../context/useAuth.js";

const inputClasses =
  "mt-2 w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";
const actionButtonClassName =
  "w-full rounded-xl py-3 text-[11px] tracking-[0.2em] bg-blue-950 text-white hover:bg-black hover:border-black";
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [form, setForm] = useState({
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

  const validateForm = () => {
    if (!token) return "Please sign in to change your password.";
    if (!form.currentPassword) return "Current password is required.";
    if (!passwordPattern.test(form.newPassword))
      return "New password must be at least 8 characters with letters, numbers, and symbols.";
    if (form.newPassword === form.currentPassword)
      return "New password must be different from your current password.";
    if (form.newPassword !== form.confirmPassword)
      return "New passwords do not match.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("user/me/password"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.message || "Unable to change your password.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(
        `${data.message || "Password changed successfully."} Please sign in again with your new password.`,
      );
      logout();
      navigate("/auth/signin");
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

  const renderPasswordField = (field, label, placeholder) => (
    <div>
      <label className="text-sm font-medium text-blue-950" htmlFor={field}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={field}
          type={visibleFields[field] ? "text" : "password"}
          value={form[field]}
          onChange={updateField(field)}
          className={`${inputClasses} mt-0 pr-12`}
          placeholder={placeholder}
          autoComplete={
            field === "currentPassword" ? "current-password" : "new-password"
          }
          required
        />
        <button
          type="button"
          onClick={() => toggleVisibility(field)}
          aria-label={visibleFields[field] ? `Hide ${label}` : `Show ${label}`}
          title={visibleFields[field] ? `Hide ${label}` : `Show ${label}`}
          className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-zinc-500 transition hover:text-blue-950"
        >
          {visibleFields[field] ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );

  if (!token) {
    return (
      <div className="border-2 border-zinc-900 bg-zinc-50 p-6 shadow-xl sm:p-8">
        <h1 className="text-3xl font-bold text-blue-950">Sign in required</h1>
        <p className="mt-4 text-sm text-zinc-600">
          Please sign in before changing your password.
        </p>
        <Button to="/auth/signin" className={`${actionButtonClassName} mt-6`}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="border-2 border-zinc-900 bg-zinc-50 p-6 shadow-xl sm:p-8">
      <div className="border-b-2 border-zinc-900 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Account Security
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
          Change Password
        </h1>
      </div>
      <p className="mt-5 text-sm leading-6 text-zinc-600">
        Update your password using a secure combination of letters, numbers, and
        symbols.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {renderPasswordField(
          "currentPassword",
          "Current Password",
          "Current password",
        )}
        {renderPasswordField("newPassword", "New Password", "New password")}
        {renderPasswordField(
          "confirmPassword",
          "Confirm New Password",
          "Confirm new password",
        )}
        <p className="text-xs leading-5 text-gray-500">
          Your new password must be at least 8 characters and include letters,
          numbers, and symbols.
        </p>
        {error && (
          <p
            role="alert"
            className="border-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="border-2 border-green-700 bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            {success}
          </p>
        )}
        <Button
          type="submit"
          className={`${actionButtonClassName} cursor-pointer transition hover:-translate-y-0.5 hover:bg-black hover:shadow-lg active:translate-y-0`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating Password..." : "Update Password"}
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-3 border-t-2 border-zinc-900 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
          className="cursor-pointer border-zinc-900 px-5 py-3 transition hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-lg active:translate-y-0"
        >
          ← Back
        </Button>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
