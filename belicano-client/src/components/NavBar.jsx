import { NavLink } from 'react-router-dom';
import logo from '../assets/img/nubdexchange_logo.png';

const links = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Products', to: '/products' },
];

const navLinkClassName = ({ isActive }) =>
  [
    'rounded-full border-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] transition',
    isActive
      ? 'border-yellow-500 bg-yellow-400 text-blue-950'
      : 'border-transparent text-yellow-200 hover:border-yellow-500 hover:text-yellow-300 hover:bg-blue-900',
  ].join(' ');

const NavBar = () => {
  return (
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
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={navLinkClassName}
            >
              {link.label}
            </NavLink>
          ))}

          <NavLink
            to="/auth/signin"
            className="ml-4 rounded-full border-2 border-yellow-500 px-4 py-2 text-[11px] font-semibold 
            uppercase tracking-[0.24em] text-yellow-200 transition hover:bg-yellow-400 hover:text-blue-950"
          >
            Sign In
          </NavLink>

        </nav>

      </div>
    </header>
  );
};

export default NavBar;