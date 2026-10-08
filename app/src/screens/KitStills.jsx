import { useEffect, useState } from 'react';
import { STILLS } from '../site/stills';

// Internal: renders the Wall's flat-lay photos so they can be saved into public/wall/.
// /kit/stills?only=w3 renders a single shot while tuning the studio.
export default function KitStills() {
  const [shots, setShots] = useState([]);
  useEffect(() => {
    const only = new URLSearchParams(window.location.search).get('only');
    import('../three/still').then(async ({ renderStill }) => {
      const out = {};
      for (const s of STILLS.filter((x) => !only || only.split(',').includes(x.id))) {
        out[s.id] = renderStill(s);
        setShots((list) => [...list, [s.id, out[s.id]]]);
        await new Promise((r) => setTimeout(r, 30));
      }
      window.__stills = out;
    });
  }, []);
  return (
    <main style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, background: '#eee' }}>
      {shots.map(([id, url]) => <figure key={id} style={{ margin: 0 }}><img src={url} alt={id} style={{ width: '100%' }} /><figcaption>{id}</figcaption></figure>)}
    </main>
  );
}
