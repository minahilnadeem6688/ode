import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Lockup, Mark } from '../components/Brand';
import { MENU } from '../lib/paths';
import './site.css';

const PAGES = [
  ['/how-it-works', 'How it works'],
  ['/for-cafes', 'For cafés'],
  ['/wall', 'The Wall'],
  ['/pricing', 'Pricing'],
];

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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const main = useRef(null);

  useLayoutEffect(() => { window.scrollTo(0, 0); setOpen(false); }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  useReveal(pathname);

  return (
    <div className="site">
      <nav className={'nav' + (scrolled ? ' nav--solid' : '')}>
        <Link to="/" className="nav__home" aria-label="ode home"><Lockup size={22} /></Link>
        <div className="nav__links">
          {PAGES.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </div>
        <div className="nav__end">
          <Link to={MENU} className="nav__try">Try the menu</Link>
          <Link to="/get-ode" className="btn btn--roast nav__cta">Get ode</Link>
          <button type="button" className={'nav__burger' + (open ? ' open' : '')} aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><i /><i /></button>
        </div>
      </nav>

      <div className={'sheet' + (open ? ' open' : '')} aria-hidden={!open}>
        {[...PAGES, [MENU, 'Try the menu'], ['/get-ode', 'Get ode']].map(([to, label], i) => (
          <Link key={to} to={to} style={{ '--i': i }} tabIndex={open ? 0 : -1}>{label}</Link>
        ))}
      </div>

      <main ref={main} key={pathname} className="page">
        <Outlet />
      </main>

      <footer className="foot">
        <div className="foot__cta" data-reveal>
          <Mark size={54} />
          <p className="display">your café, <em>written in.</em></p>
          <div className="foot__btns">
            <Link to="/get-ode" className="btn btn--honey">Start a free pilot</Link>
            <Link to={MENU} className="btn foot__ghost">Try it as a customer</Link>
          </div>
        </div>
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
