import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Lockup } from '../components/Brand';
import { MENU } from '../lib/paths';
import { useSession } from '../lib/session';
import './site.css';

export const PAGES = [
  ['/how-it-works', 'How it works'],
  ['/for-cafes', 'For cafés'],
  ['/wall', 'The Wall'],
  ['/pricing', 'Pricing'],
];

// The one ode bar, on the website and on every app screen, so home is always a tap away.
// `solid` keeps the frosted background on screens that paint their own colour underneath.
export default function Nav({ solid = false }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const me = useSession('customer');
  const team = useSession('team');
  const who = team ? ['/dashboard', 'Dashboard'] : me ? ['/account', me.user.name.split(' ')[0]] : ['/login', 'Log in'];

  useLayoutEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);

  return (
    <>
      <nav className={'nav' + (solid || scrolled ? ' nav--solid' : '')}>
        <Link to="/" className="nav__home" aria-label="ode home"><Lockup size={22} /></Link>
        <div className="nav__links">
          {PAGES.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </div>
        <div className="nav__end">
          <Link to={who[0]} className="nav__try nav__who">{(me || team) && <span className="nav__dot">{who[1][0]}</span>}{who[1]}</Link>
          <Link to="/get-ode" className="btn btn--roast nav__cta">Get ode</Link>
          <button type="button" className={'nav__burger' + (open ? ' open' : '')} aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><i /><i /></button>
        </div>
      </nav>

      <div className={'sheet' + (open ? ' open' : '')} aria-hidden={!open}>
        {[['/', 'Home'], ...PAGES, [MENU, 'Try the menu'], who, ['/get-ode', 'Get ode']].map(([to, label], i) => (
          <Link key={to} to={to} style={{ '--i': i }} tabIndex={open ? 0 : -1}>{label}</Link>
        ))}
      </div>
    </>
  );
}
