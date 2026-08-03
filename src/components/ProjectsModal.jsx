import { X, Hammer, Lock } from 'lucide-react';
import { PROJECTS } from '../lib/projects';

const wire = { stroke: '#7db87d', strokeWidth: 2, fill: 'none' };
const sym = { stroke: '#ddd', strokeWidth: 2, fill: 'none' };

// Minimal schematic symbols, drawn as a closed loop per project.
function Battery({ x, y }) {
  return (
    <g>
      <line x1={x - 10} y1={y} x2={x + 10} y2={y} {...sym} strokeWidth={3} />
      <line x1={x - 5} y1={y + 8} x2={x + 5} y2={y + 8} {...sym} />
      <text x={x + 14} y={y + 2} fill="#dd4444" fontSize="10">+</text>
      <text x={x + 14} y={y + 13} fill="#999" fontSize="12">−</text>
    </g>
  );
}
function ResistorSym({ x, y, label }) {
  return (
    <g>
      <path d={`M ${x - 18} ${y} l 4 -6 l 6 12 l 6 -12 l 6 12 l 6 -12 l 4 6`} {...sym} />
      <text x={x} y={y - 10} fill="#999" fontSize="9" textAnchor="middle">{label}</text>
    </g>
  );
}
function LedSym({ x, y }) {
  return (
    <g>
      <polygon points={`${x - 6},${y - 7} ${x - 6},${y + 7} ${x + 6},${y}`} fill="#cc3333" stroke="#cc3333" />
      <line x1={x + 6} y1={y - 7} x2={x + 6} y2={y + 7} {...sym} />
      <line x1={x + 2} y1={y - 9} x2={x + 7} y2={y - 15} stroke="#cc7733" strokeWidth={1.5} />
      <line x1={x + 7} y1={y - 15} x2={x + 4} y2={y - 14} stroke="#cc7733" strokeWidth={1.5} />
    </g>
  );
}
function SwitchSym({ x, y }) {
  return (
    <g>
      <circle cx={x - 8} cy={y} r={2} fill="#ddd" />
      <circle cx={x + 8} cy={y} r={2} fill="#ddd" />
      <line x1={x - 8} y1={y} x2={x + 8} y2={y - 9} {...sym} />
    </g>
  );
}

const SCHEMATICS = {
  'first-light': (
    <svg viewBox="0 0 200 110" style={{ width: '100%', height: 100 }}>
      <path d="M 40 30 H 70" {...wire} />
      <ResistorSym x={88} y={30} label="330 Ω" />
      <path d="M 106 30 H 120" {...wire} />
      <LedSym x={132} y={30} />
      <path d="M 138 30 H 165 V 85 H 40 V 40" {...wire} />
      <Battery x={40} y={32} />
    </svg>
  ),
  'push-button-light': (
    <svg viewBox="0 0 200 110" style={{ width: '100%', height: 100 }}>
      <path d="M 40 30 H 70" {...wire} />
      <ResistorSym x={88} y={30} label="330 Ω" />
      <path d="M 106 30 H 120" {...wire} />
      <LedSym x={132} y={30} />
      <path d="M 138 30 H 165 V 85 H 120" {...wire} />
      <SwitchSym x={110} y={85} />
      <path d="M 100 85 H 40 V 40" {...wire} />
      <Battery x={40} y={32} />
    </svg>
  ),
  'voltage-divider': (
    <svg viewBox="0 0 200 110" style={{ width: '100%', height: 100 }}>
      <path d="M 40 25 H 70" {...wire} />
      <ResistorSym x={88} y={25} label="R1 = 1 kΩ" />
      <path d="M 106 25 H 150 V 45" {...wire} />
      <circle cx={150} cy={52} r={2.5} fill="#3b82f6" />
      <text x={158} y={56} fill="#3b82f6" fontSize="9">V/2</text>
      <path d="M 150 60 V 68" {...wire} />
      <g transform="rotate(90 150 85)"><ResistorSym x={150} y={85} label="" /></g>
      <text x={122} y={88} fill="#999" fontSize="9">R2 = 1 kΩ</text>
      <path d="M 150 103 V 105 H 40 V 35" {...wire} />
      <Battery x={40} y={27} />
    </svg>
  ),
};

export default function ProjectsModal({ onClose, onLoad }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'auto', padding: 12,
    }}
    onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(880px, 96vw)', maxHeight: '88vh', overflowY: 'auto',
          background: '#141414', border: '1px solid #333', borderRadius: 12,
          color: 'white', padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', flex: 1 }}>Project Guide</h2>
          <button onClick={onClose} aria-label="Close projects" style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 8, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: 16 }}>
          Classic beginner builds. <strong style={{ color: '#bbb' }}>Build it</strong> places every part on the board for you —
          then follow the steps, poke it with the multimeter, and try changing values.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {PROJECTS.map((p) => (
            <div key={p.id} style={{
              background: '#1c1c1c', border: '1px solid #2e2e2e', borderRadius: 10,
              padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
              opacity: p.buildable ? 1 : 0.65,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <strong style={{ fontSize: '0.95rem' }}>{p.name}</strong>
                <span style={{ fontSize: '0.65rem', color: '#777', border: '1px solid #383838', borderRadius: 999, padding: '2px 8px' }}>{p.difficulty}</span>
              </div>
              {SCHEMATICS[p.id] && (
                <div style={{ background: '#101010', borderRadius: 6, padding: 6 }}>{SCHEMATICS[p.id]}</div>
              )}
              <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0 }}>{p.tagline}</p>
              <p style={{ fontSize: '0.72rem', color: '#777', margin: 0, lineHeight: 1.45 }}>{p.learn}</p>
              {p.steps && (
                <ol style={{ fontSize: '0.72rem', color: '#999', margin: 0, paddingLeft: 16, lineHeight: 1.5 }}>
                  {p.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
              <div style={{ marginTop: 'auto' }}>
                {p.buildable ? (
                  <button
                    onClick={() => onLoad(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
                      padding: '9px 12px', background: '#3b82f6', border: 'none', borderRadius: 6,
                      color: 'white', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                    }}
                  >
                    <Hammer size={15} /> Build it on the board
                  </button>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                    padding: '9px 12px', background: '#222', borderRadius: 6, color: '#666', fontSize: '0.78rem',
                  }}>
                    <Lock size={14} /> Needs AC / transient sim — coming soon
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
