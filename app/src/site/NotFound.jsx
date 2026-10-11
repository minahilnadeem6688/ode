import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MENU } from '../lib/paths';

export default function NotFound() {
  useEffect(() => { document.title = 'Not found · ode'; }, []);
  return (
    <header className="phead notfound">
      <p className="eyebrow">404</p>
      <h1 className="display">this page is not <em>on the menu.</em></h1>
      <p className="lede">The link may be old, or the address has a typo.</p>
      <div className="hero__ctas">
        <Link to="/" className="btn btn--roast">Go home</Link>
        <Link to={MENU} className="btn btn--ghost">Try the menu</Link>
      </div>
    </header>
  );
}
