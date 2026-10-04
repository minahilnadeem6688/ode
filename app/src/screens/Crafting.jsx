import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CafeBar } from '../components/Brand';
import { DROP } from '../brand/marks';
import { craft } from '../lib/craft';
import { draft, creations } from '../lib/store';
import './crafting.css';

const STEPS = ['reading your mood', 'choosing from the pantry', 'balancing it', 'writing your lines'];

export default function Crafting() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in development
    started.current = true;
    craft(draft.get(), setStage).then((c) => {
      creations.remember(c);
      setTimeout(() => navigate('/ode/' + c.id, { replace: true }), 500);
    });
  }, [navigate]);

  return (
    <main className="screen crafting" style={{ '--bg': 'linear-gradient(160deg, #EFECE2, #E5DFD2)' }}>
      <CafeBar />
      <div className="crafting__stage" data-stage={stage} aria-hidden="true">
        <span className="crafting__halo" />
        <span className="crafting__cup"><span className="crafting__liquid" /></span>
        <span className="crafting__ripple r1" /><span className="crafting__ripple r2" /><span className="crafting__ripple r3" />
        <svg className="crafting__drop d1" viewBox="0 0 50 70"><path d={DROP} transform="translate(-4 -8)" fill="#D4A55A" /></svg>
        <svg className="crafting__drop d2" viewBox="0 0 50 70"><path d={DROP} transform="translate(-4 -8)" fill="#C4858C" /></svg>
      </div>

      <h1 className="display crafting__title">writing your<br /><em>ode…</em></h1>

      <ol className="crafting__steps" aria-live="polite">
        {STEPS.map((s, i) => (
          <li key={s} className={stage > i ? 'done' : stage === i ? 'now' : ''}><i />{s}</li>
        ))}
      </ol>
      <div className="crafting__bar"><span style={{ width: (stage / 4) * 100 + '%' }} /></div>
    </main>
  );
}
