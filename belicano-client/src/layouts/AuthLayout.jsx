import { Outlet } from "react-router-dom";
import logo from "../assets/img/nubdexchange_logo.png";

const AuthLayout = () => {
  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="grid min-h-screen w-full lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden border-b-2 border-yellow-500 bg-blue-950 p-8 sm:p-10 lg:min-h-screen lg:border-b-0 lg:border-r-2 lg:p-16">
          <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative z-10 w-full max-w-md">
            <img
              src={logo}
              alt="NUBD Exchange Logo"
              className="mx-auto w-40 object-contain sm:w-48 lg:mx-0 lg:w-56"
            />
            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-400">
              BulldogEx Campus Store
            </p>
            <h1 className="mt-3 max-w-sm text-3xl font-bold leading-tight text-white sm:text-4xl">
              Your campus essentials, ready when you are.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-blue-100">
              Sign in to track orders and pickup details, or create an account
              to start shopping.
            </p>
            <div className="mt-8 grid max-w-sm grid-cols-2 gap-3">
              <div className="border-2 border-yellow-500 bg-blue-900/60 p-4">
                <p className="text-2xl font-bold text-yellow-400">01</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Quick checkout
                </p>
              </div>
              <div className="border-2 border-yellow-500 bg-blue-900/60 p-4">
                <p className="text-2xl font-bold text-yellow-400">24/7</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Order tracking
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex items-center bg-yellow-400 px-4 py-8 sm:px-8 sm:py-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </div>
    </section>
  );
};

export default AuthLayout;
