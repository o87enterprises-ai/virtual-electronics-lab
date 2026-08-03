import { MousePointerClick, Gauge, Activity, AudioWaveform } from 'lucide-react';

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

export default function InstrumentPanel({ selected, reading, onUpdate }) {
  return (
    <div style={{
      width: 220,
      background: 'rgba(15, 15, 15, 0.95)',
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
        <p style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Inspector
        </p>
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
                  background: selected.pressed ? '#cc4444' : '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: 4,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                {selected.pressed ? 'Pressed (closed)' : 'Released (open)'}
              </button>
            )}

            <div style={{ color: '#555', marginTop: 8, lineHeight: 1.5 }}>
              Drag to move · <kbd>R</kbd> rotate · <kbd>Del</kbd> remove
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
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#00cc66', lineHeight: 1.6 }}>
                <div>V: {fmt(reading.v, 'V')}</div>
                <div>I: {fmt(reading.i, 'A')}</div>
              </div>
            ) : selected && !SIMULATED.has(selected.type) ? (
              <div style={{ fontSize: '0.72rem', color: '#555' }}>This part isn&apos;t simulated yet</div>
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
