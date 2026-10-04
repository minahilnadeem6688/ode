import { Lockup, Painted } from '../components/Brand';
import { pantry } from '../data/demoCafe';

// Internal: every pantry ingredient's painted art, to check new art as the pantry grows.
export default function Kit() {
  return (
    <main style={{ padding: 24, background: 'var(--cream)', minHeight: '100svh' }}>
      <Lockup size={26} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16, marginTop: 24 }}>
        {pantry.map((i) => (
          <div key={i.id} style={{ textAlign: 'center', fontSize: 13, color: 'var(--moss-deep)' }}>
            <Painted item={i} size={110} /><br />{i.name}
          </div>
        ))}
      </div>
    </main>
  );
}
