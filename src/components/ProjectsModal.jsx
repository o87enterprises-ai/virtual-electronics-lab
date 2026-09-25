import { X, Hammer, Lock, Footprints } from 'lucide-react';
import { PROJECTS } from '../lib/projects';
import { Schematic } from './Diagrams';

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
          width: 'min(960px, 96vw)', maxHeight: '88vh', overflowY: 'auto',
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
        <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: 16, lineHeight: 1.5 }}>
          <strong style={{ color: '#bbb' }}>Guide me</strong> clears the board and walks you through the build one step
          at a time. The Circuit Coach checks every connection as you go, and tells you exactly what's wrong and how to
          fix it. <strong style={{ color: '#bbb' }}>Build it for me</strong> places every part so you can explore a
          working circuit. The full layout drawings are in the Textbook's Workshop chapter.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {PROJECTS.map((p) => (
            <div key={p.id} style={{
              background: '#1c1c1c', border: '1px solid #2e2e2e', borderRadius: 10,
              padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
              opacity: p.buildable ? 1 : 0.65,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.95rem' }}>{p.name}</strong>
                <span style={{ fontSize: '0.65rem', color: '#777', border: '1px solid #383838', borderRadius: 999, padding: '2px 8px' }}>{p.difficulty}</span>
                {p.steps && <span style={{ fontSize: '0.65rem', color: '#6aa2ff' }}>{p.steps.length} steps</span>}
              </div>
              {p.buildable && (
                <div style={{ background: '#101010', borderRadius: 6, padding: 6 }}><Schematic id={p.id} /></div>
              )}
              <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0 }}>{p.tagline}</p>
              <p style={{ fontSize: '0.72rem', color: '#777', margin: 0, lineHeight: 1.45 }}>{p.learn}</p>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.buildable ? (
                  <>
                    <button
                      onClick={() => onLoad(p, 'guided')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
                        padding: '9px 12px', background: '#3b82f6', border: 'none', borderRadius: 6,
                        color: 'white', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                      }}
                    >
                      <Footprints size={15} /> Guide me step by step
                    </button>
                    <button
                      onClick={() => onLoad(p, 'auto')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
                        padding: '8px 12px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 6,
                        color: '#ccc', cursor: 'pointer', fontSize: '0.78rem',
                      }}
                    >
                      <Hammer size={14} /> Build it for me
                    </button>
                  </>
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
