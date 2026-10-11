import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Lockup, Mark } from '../components/Brand';
import Nav, { PAGES } from './Nav';
import { MENU } from '../lib/paths';
import './site.css';

// Anything marked data-reveal rises into place the first time it scrolls into view.
function useReveal(key) {
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-reveal]:not(.is-in)')];
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return undefined; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [key]);
}

export default function Site() {
  const { pathname } = useLocation();
  const main = useRef(null);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useReveal(pathname);

  return (
    <div className="site">
      <Nav />

      <main ref={main} key={pathname} className="page">
        <Outlet />
      </main>

      <footer className="foot">
        {!['/get-ode', '/login', '/account', '/dashboard'].includes(pathname) && <div className="foot__cta" data-reveal>
          <Mark size={54} />
          <p className="display">your café, <em>written in.</em></p>
          <div className="foot__btns">
            <Link to="/get-ode" className="btn btn--honey">Start a free pilot</Link>
            <Link to={MENU} className="btn foot__ghost">Try it as a customer</Link>
          </div>
        </div>}
        <div className="foot__grid">
          <div>
            <Lockup size={22} color="var(--cream)" />
            <p className="poem">the menu is you.</p>
          </div>
          <div>
            <b>ode</b>
            {PAGES.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          </div>
          <div>
            <b>Try it</b>
            <Link to={MENU}>Customer menu</Link>
            <Link to="/barista">Barista board</Link>
            <Link to="/get-ode">Book a pilot</Link>
          </div>
        </div>
        <small>© 2026 ode · Made for cafés in Pakistan</small>
      </footer>
    </div>
  );
}
