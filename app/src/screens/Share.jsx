import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CafeBar } from '../components/Brand';
import { Ambient } from '../components/Three';
import Icon from '../components/Icon';
import { creations } from '../lib/store';
import { cafe } from '../data/demoCafe';
import { drawShareCard, canvasBlob } from '../lib/shareCard';
import './share.css';

export default function Share() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c] = useState(() => creations.get(id)); // one stable object, so the card draws once per format
  const canvas = useRef(null);
  const [format, setFormat] = useState('story');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!c || !canvas.current) return;
    setReady(false);
    drawShareCard(canvas.current, c, format).then(() => setReady(true));
  }, [c, format]);

  async function share() {
    const blob = await canvasBlob(canvas.current);
    const file = new File([blob], `ode-${c.name.toLowerCase().replace(/\W+/g, '-')}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: c.name }); return; } catch { /* closed the sheet */ return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  if (!c) return null;
  return (
    <main className="screen screen--narrow share" style={{ '--bg': 'linear-gradient(160deg, #F3ECE1, #E9DFD0)' }}>
      <Ambient variant="quiet" />
      <CafeBar left={<button type="button" className="iconbtn" aria-label="Back" onClick={() => navigate(-1)}><Icon name="back" /></button>} />
      <div className="share__tabs" role="radiogroup" aria-label="Format">
        {[['story', 'story'], ['post', 'square post']].map(([f, l]) => <button key={f} type="button" role="radio" aria-checked={format === f} onClick={() => setFormat(f)}>{l}</button>)}
      </div>
      <div className={'share__preview ' + format + (ready ? ' ready' : '')}><canvas ref={canvas} aria-label={`Share card for ${c.name}`} /></div>
      <div className="share__cta">
        <button type="button" className="btn btn--cherry btn--block" disabled={!ready} onClick={share}><Icon name="download" size={20} /> Save or share</button>
        <p className="muted share__note">Tag {cafe.handle} and they might put it on the wall.</p>
      </div>
    </main>
  );
}
