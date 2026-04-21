import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className="border-t-2 border-yellow-500 bg-blue-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-yellow-400 sm:flex-row sm:items-center sm:justify-between">
        
        <div>
          <p className="text-lg font-bold">BulldogEx Shop</p>
          <p className="mt-1 text-sm text-yellow-300">
            Campus essentials, simple ordering.
          </p>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-500 space-x-4">
          <Link to="/" className="hover:text-yellow-300 transition">
            Home
          </Link>
          <span>|</span>
          <Link to="/about" className="hover:text-yellow-300 transition">
            About
          </Link>
          <span>|</span>
          <Link to="/auth/signup" className="hover:text-yellow-300 transition">
            Join us
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Footer;
