import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CafeBar } from '../components/Brand';
import { Ambient } from '../components/Three';
import Icon from '../components/Icon';
import { creations } from '../lib/store';
import { cafe } from '../data/demoCafe';
import { drawShareCard, canvasBlob } from '../lib/shareCard';
import './share.css';

const ios = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// What this browser can do with an image file: open the phone's share sheet, or copy it.
function abilities() {
  let share = false;
  try { share = !!navigator.canShare?.({ files: [new File(['x'], 'x.png', { type: 'image/png' })] }); } catch { share = false; }
  return { share, copy: !!(navigator.clipboard?.write && window.ClipboardItem) };
}

export default function Share() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c] = useState(() => creations.get(id)); // one stable object, so the card draws once per format
  const canvas = useRef(null);
  const [format, setFormat] = useState('story');
  const [card, setCard] = useState(null); // { blob, url } of the finished image
  const [note, setNote] = useState('');
  const [can] = useState(abilities);

  useEffect(() => {
    if (!c || !canvas.current) return undefined;
    let url = '', live = true;
    setCard(null);
    drawShareCard(canvas.current, c, format).then(() => canvasBlob(canvas.current)).then((blob) => {
      if (!live) return;
      url = URL.createObjectURL(blob);
      setCard({ blob, url });
    });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [c, format]);

  useEffect(() => {
    if (!note) return undefined;
    const t = setTimeout(() => setNote(''), 4200);
    return () => clearTimeout(t);
  }, [note]);

  const fileName = () => `ode-${c.name.toLowerCase().replace(/\W+/g, '-')}-${format}.png`;

  // Save: always a file on the device, never the share sheet.
  function save() {
    const a = document.createElement('a');
    a.href = card.url;
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setNote(ios() ? 'Saved to Files. To add it to Photos, press and hold the picture and choose Save to Photos.' : 'Saved to your downloads.');
  }

  // Share: the phone's own share sheet, to Instagram, WhatsApp, Messages and the rest.
  async function share() {
    const file = new File([card.blob], fileName(), { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: c.name, text: `${c.name} at ${cafe.name} ${cafe.handle}` });
    } catch (e) {
      if (e?.name !== 'AbortError') setNote('Sharing did not open here. Use Save image instead.');
    }
  }

  // Copy: on computers, where there is no share sheet, paste it straight into a chat or a post.
  async function copy() {
    try {
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': card.blob })]);
      setNote('Copied. Paste it into a chat or a post.');
    } catch {
      setNote('Copying is blocked in this browser. Use Save image instead.');
    }
  }

  if (!c) return null;
  return (
    <main className="screen screen--narrow share" style={{ '--bg': 'linear-gradient(160deg, #F3ECE1, #E9DFD0)' }}>
      <Ambient variant="quiet" />
      <CafeBar left={<button type="button" className="iconbtn" aria-label="Back" onClick={() => navigate(-1)}><Icon name="back" /></button>} />
      <div className="share__tabs" role="radiogroup" aria-label="Format">
        {[['story', 'story'], ['post', 'square post']].map(([f, l]) => <button key={f} type="button" role="radio" aria-checked={format === f} onClick={() => setFormat(f)}>{l}</button>)}
      </div>
      <div className={'share__preview ' + format + (card ? ' ready' : '')}>
        <canvas ref={canvas} aria-hidden="true" />
        {card && <img src={card.url} alt={`Share card for ${c.name}`} />}
      </div>
      <div className="share__cta">
        <div className="share__btns">
          <button type="button" className="btn btn--cherry" disabled={!card} onClick={save}><Icon name="download" size={20} /> Save image</button>
          {can.share
            ? <button type="button" className="btn btn--ghost" disabled={!card} onClick={share}><Icon name="share" size={20} /> Share</button>
            : can.copy && <button type="button" className="btn btn--ghost" disabled={!card} onClick={copy}><Icon name="copy" size={20} /> Copy image</button>}
        </div>
        <p className="share__toast" role="status" aria-live="polite">{note}</p>
        <p className="muted share__note">Tag {cafe.handle} and they might put it on the wall.</p>
      </div>
    </main>
  );
}
