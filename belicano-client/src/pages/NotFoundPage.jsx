import Button from "../components/Button";

const NotFoundPage = () => {
  const navItems = [
    { href: "/", label: "Home", description: "Back to the homepage" },
    {
      href: "/products",
      label: "Products",
      description: "Browse all store items",
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border-2 border-black bg-gradient-to-br from-white to-blue-50 p-8 sm:p-12 shadow-lg">
          <div className="text-center mb-10">
            <div className="mb-6 inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-900 to-blue-950 border-4 border-yellow-500 shadow-lg">
              <span className="text-6xl font-black text-white">404</span>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-yellow-600 mb-3">
              Page Not Found
            </p>

            <h1 className="text-4xl sm:text-5xl font-black text-blue-950 mb-4">
              Page Not Found
            </h1>

            <p className="text-base text-gray-700 max-w-md mx-auto mb-8">
              The page you're looking for doesn't exist or has been moved. Let's
              get you back on track with one of these options.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative rounded-xl border-2 border-black bg-white p-6 transition-all duration-300 hover:shadow-xl hover:border-yellow-500 hover:bg-gradient-to-br hover:from-white hover:to-yellow-50 overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-yellow-400 to-transparent opacity-0 group-hover:opacity-10 rounded-bl-full transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <h3 className="text-lg font-black text-blue-950 group-hover:text-yellow-600 transition-colors">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 group-hover:text-gray-700">
                    {item.description}
                  </p>
                  <p className="mt-4 text-sm font-bold text-black group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center">
                    Explore →
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
