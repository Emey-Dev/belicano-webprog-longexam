import { useState } from 'react';
import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/img/nubdexchange_logo.png';
import { authHeaders, useAuth } from '../context/useAuth.js';
import { apiUrl } from '../config/api.js';

const links = [
  { label: 'Home', to: '/', icon: HomeIcon },
  { label: 'About', to: '/about', icon: AboutIcon },
  { label: 'Products', to: '/products', icon: ProductsIcon },
];

const navLinkClassName = ({ isActive }) =>
  [
    'flex min-w-[68px] flex-col items-center justify-center rounded-full border-2 px-3 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.16em] transition',
    isActive
      ? 'border-yellow-500 bg-yellow-400 text-blue-950'
      : 'border-transparent text-yellow-200 hover:border-yellow-500 hover:text-yellow-300 hover:bg-blue-900',
  ].join(' ');

const CartIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" />
    <circle cx="10" cy="20" r="1" />
    <circle cx="18" cy="20" r="1" />
  </svg>
);

function HomeIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>;
}

function AboutIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11v5M12 8h.01" /></svg>;
}

function ProductsIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16v12H4zM7 8V5a5 5 0 0 1 10 0v3" /><path strokeLinecap="round" d="M8 13h8" /></svg>;
}

const OrdersIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4" />
  </svg>
);

const LogoutIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v8m-5.5-5A8 8 0 1 0 17.5 6" />
  </svg>
);

const AdminIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M6 17V7l6-3 6 3v10M9 17v-4h6v4M9 9h.01M15 9h.01" />
  </svg>
);

const SupplierIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  </svg>
);

const NavBar = () => {
  const { user, token, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showDeactivationPrompt, setShowDeactivationPrompt] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const userId = user?._id;
  const userRole = user?.userRole;
  const handleLogout = () => {
    setShowLogoutPrompt(false);
    logout();
    navigate('/');
  };
  const closeLogoutPrompt = () => setShowLogoutPrompt(false);
  const handleDeactivationLogout = () => {
    setShowDeactivationPrompt(false);
    logout();
    navigate("/");
  };
  useEffect(() => {
    if (!userId || !token) return undefined;
    const checkAccountStatus = async () => {
      const response = await fetch(apiUrl(`user/${userId}`), { headers: authHeaders(token) });
      if (response.status === 403) setShowDeactivationPrompt(true);
      else if (response.ok) updateUser(await response.json());
    };
    void checkAccountStatus().catch(() => {});
    const statusTimer = window.setInterval(() => void checkAccountStatus().catch(() => {}), 5000);
    return () => window.clearInterval(statusTimer);
  }, [token, userId, updateUser]);
  useEffect(() => {
    if (!userId || userRole === 'supplier') return undefined;
    const loadCartCount = async () => {
      const cartResponse = await fetch(apiUrl(`cart/${userId}`), { headers: authHeaders(token) });
      if (cartResponse.ok) {
        const cart = await cartResponse.json();
        setCartCount((cart.cartItems || []).reduce((total, item) => total + item.quantity, 0));
      } else {
        setCartCount(0);
      }
    };
    const loadOrderCount = async () => {
      const orderResponse = await fetch(apiUrl(`order${userRole === 'admin' ? '?mine=true' : ''}`), { headers: authHeaders(token) });
      if (orderResponse.ok) {
        const orders = await orderResponse.json();
        setOrderCount(
          Array.isArray(orders)
            ? orders.filter(
                (order) => !["Cancelled", "Completed"].includes(order.orderStatus),
              ).length
            : 0,
        );
      } else {
        setOrderCount(0);
      }
    };
    const loadCounts = async () => {
      await Promise.all([loadCartCount(), loadOrderCount()]);
    };
    void loadCounts().catch(() => {
      setCartCount(0);
      setOrderCount(0);
    });
    const handleCartUpdated = (event) => {
      if (typeof event.detail?.cartCount === 'number') {
        setCartCount(event.detail.cartCount);
      } else {
        void loadCartCount();
      }
    };
    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('orders-updated', loadOrderCount);
    const refreshTimer = window.setInterval(() => {
      void loadCounts().catch(() => {});
    }, 10000);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('orders-updated', loadOrderCount);
    };
  }, [token, userId, userRole]);
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b-2 border-yellow-500 bg-blue-950/95 backdrop-blur">
      
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-3 sm:px-4 lg:px-1 py-6">
        
        <NavLink to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="NUBD Exchange"
            className="h-10 w-10 rounded-full border-2 border-yellow-500 bg-blue-900 object-contain"
          />
          <div className="leading-tight">
            <p className="text-lg font-bold text-yellow-400">
              BulldogEx
            </p>
            <p className="text-[10px] tracking-[0.2em] text-yellow-200 uppercase">
              Campus Shop
            </p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={navLinkClassName}
            >
              <Icon />
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider">{link.label}</span>
            </NavLink>
            );
            })}

          {user ? <>
            {['customer', 'admin'].includes(user.userRole) && <NavLink to="/cart" aria-label={`Cart with ${cartCount} items`} title="Cart" className={`${navLinkClassName({ isActive: location.pathname === '/cart' })} relative flex flex-col items-center`}>
              <CartIcon /><span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider">Cart</span><span className="absolute -right-1 -top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] text-blue-950">{cartCount}</span>
            </NavLink>}
            {['customer', 'admin'].includes(user.userRole) && <NavLink to="/orders" aria-label={`Orders with ${orderCount} active orders`} title="Orders" className={`${navLinkClassName({ isActive: location.pathname === '/orders' })} relative flex flex-col items-center`}>
              <OrdersIcon /><span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider">Orders</span><span className="absolute -right-1 -top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] text-blue-950">{orderCount}</span>
            </NavLink>}
            {user.userRole === 'admin' && (
              <NavLink
                to="/admin"
                aria-label="Manage store"
                title="Manage store"
                className={`${navLinkClassName({ isActive: location.pathname === '/admin' })} cursor-pointer`}
              >
                <AdminIcon />
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider">Manage store</span>
              </NavLink>
            )}
            {user.userRole === 'supplier' && (
              <NavLink
                to="/supplier"
                aria-label="Manage supplies"
                title="Manage supplies"
                className={`${navLinkClassName({ isActive: location.pathname === '/supplier' })} cursor-pointer`}
              >
                <SupplierIcon />
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider">Manage supplies</span>
              </NavLink>
            )}
            <div className="ml-2 flex items-center gap-4 border-l-2 border-yellow-500 pl-4 text-right text-yellow-200">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                  {user.userRole === "admin" ? "Admin" : user.userRole === "supplier" ? "Supplier" : "Customer"}
                </p>
                <p className="text-sm font-bold text-yellow-400">{user.firstName} {user.lastName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutPrompt(true)}
                aria-label="Log out"
                title="Log out"
                className="cursor-pointer rounded-full border-2 border-red-700 bg-red-600 p-2 text-white shadow-md transition hover:bg-red-700 hover:shadow-lg"
              >
                <LogoutIcon />
              </button>
            </div>
          </> : <NavLink to="/auth/signin" className={navLinkClassName}>Sign In</NavLink>}

        </nav>

      </div>
    </header>
      {showLogoutPrompt && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-950/70 px-4 py-6"
          role="presentation"
          onKeyDown={(event) => { if (event.key === 'Escape') closeLogoutPrompt(); }}
          tabIndex={-1}
          autoFocus
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLogoutPrompt();
          }}
        >
          <section
            className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-prompt-title"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Account action
            </p>
            <h2 id="logout-prompt-title" className="mt-2 text-2xl font-bold text-blue-950">
              Log out of BulldogEx?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Your current session will end, but your account and order history
              will remain saved.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeLogoutPrompt}
                className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-black hover:bg-black"
              >
                Log out
              </button>
            </div>
          </section>
        </div>
      )}
      {showDeactivationPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-blue-950/70 px-4 py-6" role="presentation">
          <section className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="deactivation-prompt-title">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Account status</p>
            <h2 id="deactivation-prompt-title" className="mt-2 text-2xl font-bold text-blue-950">Your account has been deactivated</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">This account can no longer access BulldogEx. Please contact the administrator for assistance.</p>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={handleDeactivationLogout} className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">Return to sign in</button>
            </div>
          </section>
        </div>
      )}
      </>
  );
};

export default NavBar;
