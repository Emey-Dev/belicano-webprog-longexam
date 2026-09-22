import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { apiUrl } from "../../config/api.js";
import { useAuth } from "../../context/useAuth.js";

const inputClasses =
  "mt-2 w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const [details, setDetails] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  if (!user || !token) {
    return (
      <section className="mx-auto max-w-3xl border-y-2 border-zinc-900 bg-zinc-50 px-4 py-10 sm:px-8">
        <h1 className="text-3xl font-bold text-blue-950">Sign in required</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Please sign in to view your profile.
        </p>
        <Button to="/auth/signin" className="mt-6 bg-blue-950 text-white">
          Sign In
        </Button>
      </section>
    );
  }

  const saveDetails = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!details.firstName.trim() || !details.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    setSavingDetails(true);
    try {
      const response = await fetch(apiUrl(`user/${user._id}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(details),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.message || "Unable to update your profile.");
      updateUser(data);
      setMessage("Profile details updated successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to update your profile.");
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-8 sm:px-6 sm:pt-10">
      <section className="rounded-3xl border-2 border-zinc-900 bg-blue-950 p-6 text-white shadow-xl sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-400">
          Account profile
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">My Profile</h1>
        <p className="mt-3 text-sm text-blue-100">
          Manage your {user.userRole} account details. Password changes are
          available in the secure account page.
        </p>
      </section>

      <div className="grid gap-5">
        <form
          onSubmit={saveDetails}
          className="rounded-3xl border-2 border-zinc-900 bg-white p-6 shadow-xl sm:p-8"
        >
          <h2 className="text-2xl font-bold text-blue-950">Profile details</h2>
          <label
            className="mt-6 block text-sm font-medium text-blue-950"
            htmlFor="profile-first-name"
          >
            First name
          </label>
          <input
            id="profile-first-name"
            className={inputClasses}
            value={details.firstName}
            onChange={(event) =>
              setDetails({ ...details, firstName: event.target.value })
            }
            required
          />
          <label
            className="mt-4 block text-sm font-medium text-blue-950"
            htmlFor="profile-last-name"
          >
            Last name
          </label>
          <input
            id="profile-last-name"
            className={inputClasses}
            value={details.lastName}
            onChange={(event) =>
              setDetails({ ...details, lastName: event.target.value })
            }
            required
          />
          <label
            className="mt-4 block text-sm font-medium text-blue-950"
            htmlFor="profile-email"
          >
            Email address
          </label>
          <input
            id="profile-email"
            className={`${inputClasses} bg-zinc-100`}
            value={user.email}
            readOnly
            disabled
          />
          <p className="mt-2 text-xs text-zinc-500">
            Email address cannot be changed here.
          </p>
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="mt-5 rounded-xl border-2 border-green-700 bg-green-50 px-3 py-2 text-sm text-green-700"
            >
              {message}
            </p>
          )}
          <Button
            type="submit"
            className="mt-6 cursor-pointer bg-blue-950 text-white transition hover:-translate-y-0.5 hover:bg-black hover:shadow-lg active:translate-y-0"
            disabled={savingDetails}
          >
            {savingDetails ? "Saving..." : "Save Profile"}
          </Button>
        </form>
        <section className="flex flex-col items-start justify-between gap-4 rounded-3xl border-2 border-zinc-900 bg-white p-6 shadow-xl sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-950">
              Account security
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
              Change your password from the dedicated secure page.
            </p>
          </div>
          <Button
            to="/auth/change-password"
            className="shrink-0 cursor-pointer bg-blue-950 text-white transition hover:-translate-y-0.5 hover:bg-black hover:shadow-lg active:translate-y-0"
          >
            Change Password
          </Button>
        </section>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={() => navigate(-1)}
        className="cursor-pointer border-zinc-900 px-5 py-3 transition hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-lg active:translate-y-0"
      >
        ← Back
      </Button>
    </div>
  );
};

export default UserProfilePage;
