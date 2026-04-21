import { Outlet } from "react-router-dom";
import logo from "../assets/img/nubdexchange_logo.png";

const AuthLayout = () => {
  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="grid min-h-screen w-full lg:grid-cols-[1fr_0.95fr]">

        <div className="flex items-center justify-center border-b-2 border-yellow-500 bg-blue-950 p-8 sm:p-10 lg:border-b-0 lg:border-r-2 lg:border-yellow-500 lg:p-16">
          <div className="flex items-center justify-center">
            <img
              src={logo}
              alt="NUBD Exchange Logo"
              className="w-48 sm:w-56 lg:w-64 object-contain"
            />
          </div>
        </div>

        <main className="flex items-center bg-gradient-to-br from-yellow-400 to-yellow-500 px-6 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </div>
    </section>
  );
};

export default AuthLayout;
