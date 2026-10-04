import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CafeBar } from '../components/Brand';
import { Cup } from '../components/Three';
import { craft as craftHere } from '../lib/craft';
import { craft as craftOnline, online } from '../lib/api';
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
    const input = draft.get();
    const began = Date.now();
    (async () => {
      if (await online()) {
        try { return await craftOnline(input, setStage); } catch { setStage(0); }
      }
      return { ...(await craftHere(input, setStage)), local: true };
    })().then((c) => {
      creations.remember(c);
      // never rush it: the cup takes a few seconds to fill
      setTimeout(() => navigate('/ode/' + c.id, { replace: true }), Math.max(500, 3200 - (Date.now() - began)));
    });
  }, [navigate]);

  return (
    <main className="screen crafting" style={{ '--bg': 'linear-gradient(160deg, #EFECE2, #E5DFD2)' }}>
      <CafeBar />
      <div className="crafting__stage3d" aria-hidden="true">
        <Cup mode="crafting" stage={stage} colors={['#D9B27A', '#E3AAB2', '#C99A6A', '#EED3C0']} className="crafting__canvas" />
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
