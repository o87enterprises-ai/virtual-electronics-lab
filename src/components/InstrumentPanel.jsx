import { MousePointerClick, Gauge, Activity, AudioWaveform, X, RotateCw, Trash2, TriangleAlert } from 'lucide-react';
import { FAULT_MESSAGES } from '../lib/simulate';

const TYPE_LABELS = {
  Resistor: 'Resistor', LED: 'LED (Red)', Capacitor: 'Capacitor', Diode: 'Diode (1N4001)',
  Transistor: 'Transistor (NPN)', IC: 'IC (555 Timer)', Switch: 'Push Button',
  PowerSupply: 'DC Power Supply', Antenna: 'Antenna', Magnet: 'Magnet', Wire: 'Jumper Wire',
};

const SIMULATED = new Set(['Resistor', 'LED', 'Capacitor', 'Diode', 'Switch', 'PowerSupply', 'Wire']);

const fmt = (value, unit) => {
  const abs = Math.abs(value);
  if (abs >= 1) return `${value.toFixed(2)} ${unit}`;
  if (abs >= 1e-3) return `${(value * 1e3).toFixed(2)} m${unit}`;
  if (abs >= 1e-6) return `${(value * 1e6).toFixed(2)} µ${unit}`;
  return `0 ${unit}`;
};

export default function InstrumentPanel({ selected, reading, fault, onUpdate, onRotate, onDelete, onClose }) {
  return (
    <div style={{
      width: 230,
      maxWidth: '85vw',
      height: '100%',
      background: 'rgba(15, 15, 15, 0.97)',
      color: 'white',
      padding: 16,
      overflowY: 'auto',
      borderLeft: '1px solid #333',
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', flex: 1, margin: 0 }}>
            Inspector
          </p>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close inspector"
              style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 6, display: 'flex' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
        {selected ? (
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 10, fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{TYPE_LABELS[selected.type] || selected.type}</div>
            <div style={{ color: '#888' }}>
              x: {selected.position[0].toFixed(2)} &nbsp; z: {selected.position[2].toFixed(2)}
            </div>
            <div style={{ color: '#888' }}>
              rotation: {Math.round(((selected.rotation || 0) * 180 / Math.PI) % 360)}°
            </div>

            {selected.type === 'Resistor' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#aaa' }}>
                <span>R:</span>
                <input
                  type="number"
                  min="1"
                  value={selected.value ?? 1000}
                  onChange={(e) => onUpdate(selected.id, { value: Math.max(Number(e.target.value) || 1, 1) })}
                  style={{ width: 70, background: '#0d0d0d', color: '#eee', border: '1px solid #333', borderRadius: 4, padding: '3px 6px' }}
                />
                <span>Ω</span>
              </label>
            )}
            {selected.type === 'PowerSupply' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#aaa' }}>
                <span>V:</span>
                <input
                  type="number"
                  min="0"
                  max="48"
                  step="0.5"
                  value={selected.value ?? 5}
                  onChange={(e) => onUpdate(selected.id, { value: Math.min(Math.max(Number(e.target.value) || 0, 0), 48) })}
                  style={{ width: 70, background: '#0d0d0d', color: '#eee', border: '1px solid #333', borderRadius: 4, padding: '3px 6px' }}
                />
                <span>V</span>
              </label>
            )}
            {selected.type === 'Switch' && (
              <button
                onClick={() => onUpdate(selected.id, { pressed: !selected.pressed })}
                style={{
                  marginTop: 8,
                  padding: '5px 10px',
                  background: selected.pressed ? '#14532d' : '#2a2a2a',
                  border: `1px solid ${selected.pressed ? '#22c55e' : '#444'}`,
                  borderRadius: 4,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                {selected.pressed ? 'Pressed (closed)' : 'Released (open)'}
              </button>
            )}
            {selected.type === 'PowerSupply' && (
              <button
                onClick={() => onUpdate(selected.id, { on: selected.on === false })}
                style={{
                  marginTop: 8,
                  padding: '5px 10px',
                  background: selected.on !== false ? '#14532d' : '#2a2a2a',
                  border: `1px solid ${selected.on !== false ? '#22c55e' : '#444'}`,
                  borderRadius: 4,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Output {selected.on !== false ? 'ON' : 'OFF'}
              </button>
            )}

            {fault && (
              <div style={{
                display: 'flex', gap: 6, marginTop: 8, padding: 8,
                background: '#2a1212', border: '1px solid #713', borderRadius: 4,
                color: '#ff8877', fontSize: '0.72rem', lineHeight: 1.4,
              }}>
                <TriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{FAULT_MESSAGES[fault] || fault}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={onRotate} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 6px', background: '#2a2a2a', border: '1px solid #444',
                borderRadius: 4, color: '#ddd', cursor: 'pointer', fontSize: '0.75rem',
              }}>
                <RotateCw size={13} /> Rotate
              </button>
              <button onClick={onDelete} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 6px', background: '#3a1a1a', border: '1px solid #644',
                borderRadius: 4, color: '#ff9988', cursor: 'pointer', fontSize: '0.75rem',
              }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#555', fontSize: '0.8rem' }}>
            <MousePointerClick size={14} />
            <span>Click a placed component to inspect it</span>
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Instruments
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: '#777' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Gauge size={14} color="#00cc66" /> <span style={{ color: '#ccc' }}>Multimeter</span>
            </div>
            {selected && reading ? (
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: fault ? '#ff7755' : '#00cc66', lineHeight: 1.6 }}>
                <div>V: {fmt(reading.v, 'V')}</div>
                <div>I: {fmt(reading.i, 'A')}</div>
                <div>P: {fmt(Math.abs(reading.v * reading.i), 'W')}</div>
              </div>
            ) : selected && !SIMULATED.has(selected.type) ? (
              <div style={{ fontSize: '0.72rem', color: '#555' }}>This part isn&apos;t simulated yet</div>
            ) : selected && selected.type === 'PowerSupply' && selected.on === false ? (
              <div style={{ fontSize: '0.72rem', color: '#555' }}>Output is off — press Turn On</div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#555' }}>Select a part in a powered circuit</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} /> <span>Oscilloscope</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#444' }}>coming soon</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AudioWaveform size={14} /> <span>Function Gen</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#444' }}>coming soon</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: '#444', lineHeight: 1.5 }}>
        Red/blue dots on a selected part mark its terminals (+/−). Ends touching
        the same hole are connected — line them up to build a circuit.
      </div>
    </div>
  );
}
