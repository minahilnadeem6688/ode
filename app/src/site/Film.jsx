import { useEffect, useRef, useState } from 'react';
import './film.css';

// The opening scene: a bean breaks, the grounds fall, the cup fills and a heart rises in the crema.
// It is a strip of frames played by scroll, so it runs forward and back with the visitor.
const COUNT = 88;
const BEATS = [
  [0, 'it starts with a feeling'],
  [0.24, 'broken down to what matters'],
  [0.5, 'brewed from your shelf'],
  [0.7, 'poured only for them'],
];
const HOLD = 0.9; // the last stretch of scroll rests on the finished cup

const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const src = (set, i) => `/film/${set}/${String(i).padStart(3, '0')}.webp`;

// Load the strip coarse to fine, so a fast scroll always has a frame near where it lands.
function order() {
  const out = [], seen = new Set();
  for (let step = 16; step >= 1; step /= 2) for (let i = 0; i < COUNT; i += step) if (!seen.has(i)) { seen.add(i); out.push(i); }
  return out;
}

export default function Film({ children }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const [beat, setBeat] = useState(0);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    const el = wrap.current, cv = canvas.current, ctx = cv.getContext('2d');
    const small = window.innerWidth * Math.min(2, window.devicePixelRatio || 1) < 760 || navigator.connection?.saveData;
    const set = small ? 'sm' : 'lg';
    const frames = new Array(COUNT);
    let current = still() ? COUNT - 1 : 0, target = current, shown = -1, raf = 0, live = false;

    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
      shown = -1; draw();
    };
    const nearest = (i) => {
      for (let k = 0; k < COUNT; k++) {
        if (frames[i - k]?.complete) return frames[i - k];
        if (frames[i + k]?.complete) return frames[i + k];
      }
      return null;
    };
    const draw = () => {
      const i = Math.round(current), img = nearest(i);
      if (!img || (i === shown && img === frames[i])) return;
      // cover, like object-fit: the cup is centred, so a narrow screen only loses empty cream at the sides
      const k = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight);
      const w = img.naturalWidth * k, h = img.naturalHeight * k;
      ctx.drawImage(img, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      if (img === frames[i]) shown = i;
    };
    const read = () => {
      const r = el.getBoundingClientRect(), room = r.height - window.innerHeight;
      const p = room > 0 ? Math.min(1, Math.max(0, -r.top / room)) : 1;
      target = still() ? COUNT - 1 : Math.min(1, p / HOLD) * (COUNT - 1);
      const t = target / (COUNT - 1);
      setBeat(BEATS.reduce((b, [at], k) => (t >= at ? k : b), 0));
      setMoved(p > 0.02);
    };
    const tick = () => {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.02) current = target;
      draw();
      raf = live ? requestAnimationFrame(tick) : 0;
    };

    order().forEach((i) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => draw();
      img.src = src(set, i);
      frames[i] = img;
    });

    const io = new IntersectionObserver(([e]) => {
      live = e.isIntersecting;
      if (live && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    read(); size();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', size);
    return () => {
      io.disconnect(); cancelAnimationFrame(raf); live = false;
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', size);
    };
  }, []);

  return (
    <section ref={wrap} className="film">
      <div className="film__pin">
        <div className="film__text">{children}</div>
        <figure className="film__stage">
          <img className="film__poster" src={src('lg', 0)} alt="A coffee bean breaks over a cup, the grounds fall in and a latte with a heart in the crema appears" fetchPriority="high" />
          <canvas ref={canvas} aria-hidden="true" />
          <figcaption className="film__beat">
            {BEATS.map(([, line], k) => <span key={line} className={k === beat ? 'on' : ''}>{line}</span>)}
          </figcaption>
        </figure>
        <ol className="film__rail" aria-hidden="true">
          {BEATS.map(([, line], k) => <li key={line} className={k === beat ? 'on' : k < beat ? 'past' : ''}>{String(k + 1).padStart(2, '0')}</li>)}
        </ol>
        <span className={'film__hint' + (moved ? ' gone' : '')} aria-hidden="true">scroll</span>
      </div>
    </section>
  );
}
