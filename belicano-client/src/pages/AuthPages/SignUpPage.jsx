import { Link } from "react-router-dom";
import Button from "../../components/Button";

const inputClasses =
  "mt-2 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300";

const actionButtonClassName =
  "w-full rounded-xl py-3 text-[11px] tracking-[0.2em] bg-yellow-400 text-black hover:bg-yellow-300";

const SignUpPage = () => {
  return (
    <div className="min-h-screen rounded-3xl bg-blue-950 flex items-center justify-center px-6 sm:px-4">

      <div className="w-full max-w-md rounded-3xl bg-white/95 shadow-xl border border-blue-900/20 p-7 sm:p-8 transition hover:shadow-2xl hover:-translate-y-0.5 duration-300">
        <h1 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl text-center">
          Sign Up
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 text-center">
          Create a store account for faster checkout, order updates, and pickup
          details.
        </p>

        <form className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-blue-950">
                First Name
              </label>
              <input
                type="text"
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
                placeholder="Last name"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-blue-950">Email</label>
            <input
              type="email"
              placeholder="student@email.com"
              className={inputClasses}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-blue-950">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              className={inputClasses}
            />
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Use a secure password with letters, numbers, and symbols.
            </p>
          </div>

          <Button type="submit" className={actionButtonClassName}>
            Create Account
          </Button>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl py-3 text-[11px] tracking-[0.2em] border border-gray-300 text-black hover:bg-gray-100"
            >
              Google
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl py-3 text-[11px] tracking-[0.2em] border border-gray-300 text-black hover:bg-gray-100"
            >
              Apple
            </Button>
          </div>
        </form>

        <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-700 text-center">
          Already have an account?{" "}
          <Link
            to="/auth/signin"
            className="font-semibold text-yellow-500 hover:underline"
          >
            Log In
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs tracking-[0.2em] text-gray-500 hover:text-black transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
