import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

const Layout = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.state?.restoreScroll) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.state]);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <NavBar />
      <main className="pb-16 pt-20">
        <Outlet />
      </main>
      <Footer/>
    </div>
  );
};

export default Layout;
