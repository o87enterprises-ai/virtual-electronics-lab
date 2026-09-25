// The single place to operate a part: click it on the board and everything
// you can do with it — switch it, set its value, read the meter, move,
// rotate, delete — is on this one card.

import {
  X, Move, RotateCw, Trash2, Power, CircleDot, TriangleAlert, Lightbulb, Gauge,
} from 'lucide-react';
import { FAULT_MESSAGES, LED_COLORS } from '../lib/simulate';

const TYPE_LABELS = {
  Resistor: 'Resistor', LED: 'LED', Capacitor: 'Capacitor', Diode: 'Diode (1N4001)',
  Transistor: 'Transistor (NPN)', IC: 'IC (555 Timer)', Switch: 'Push Button',
  PowerSupply: 'DC Power Supply', Antenna: 'Antenna', Magnet: 'Magnet', Wire: 'Jumper Wire',
};

const SIMULATED = new Set(['Resistor', 'LED', 'Capacitor', 'Diode', 'Switch', 'PowerSupply', 'Wire', 'Transistor']);
const RESISTOR_PRESETS = [220, 330, 1000, 10000, 100000];

const fmt = (value, unit) => {
  const abs = Math.abs(value);
  // the solver's tiny leakage terms read as microvolts on an idle part
  if (abs < (unit === 'V' ? 1e-4 : 1e-7)) return `0 ${unit}`;
  if (abs >= 1) return `${value.toFixed(2)} ${unit}`;
  if (abs >= 1e-3) return `${(value * 1e3).toFixed(2)} m${unit}`;
  if (abs >= 1e-6) return `${(value * 1e6).toFixed(1)} µ${unit}`;
  return `0 ${unit}`;
};
const ohms = (r) => (r >= 1000 ? `${+(r / 1000).toFixed(1)}k` : `${r}`);

const btn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '9px 8px', background: '#262626', border: '1px solid #3d3d3d',
  borderRadius: 8, color: '#e6e6e6', cursor: 'pointer', fontSize: '0.78rem', flex: 1,
};
const chip = (active) => ({
  padding: '4px 8px', borderRadius: 999, fontSize: '0.72rem', cursor: 'pointer',
  border: `1px solid ${active ? '#3b82f6' : '#3d3d3d'}`,
  background: active ? '#1d3a6b' : '#1f1f1f', color: active ? 'white' : '#bbb',
});
const input = {
  width: 76, background: '#0d0d0d', color: '#eee', border: '1px solid #3d3d3d',
  borderRadius: 6, padding: '5px 7px', fontSize: '0.8rem',
};

// Stops clicks inside the menu reaching the 3D scene underneath.
const swallow = {
  onPointerDown: (e) => e.stopPropagation(),
  onPointerUp: (e) => e.stopPropagation(),
  onClick: (e) => e.stopPropagation(),
  onDoubleClick: (e) => e.stopPropagation(),
  onWheel: (e) => e.stopPropagation(),
};

export default function PartMenu({
  comp, reading, fault, hint, onUpdate, onRotate, onDelete, onMove, onClose, sheet = false,
}) {
  if (!comp) return null;
  const on = comp.on !== false;
  const title = TYPE_LABELS[comp.type] || comp.type;

  return (
    <div
      {...swallow}
      style={{
        width: sheet ? '100%' : 244,
        background: 'rgba(20, 20, 20, 0.97)',
        border: '1px solid #3a3a3a',
        borderRadius: sheet ? '14px 14px 0 0' : 12,
        boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
        color: 'white',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {comp.ref && <span style={{ color: '#6aa2ff', marginRight: 6 }}>{comp.ref}</span>}
            {title}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close menu" style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      {/* the part's own control, front and centre */}
      {comp.type === 'Switch' && (
        <button
          onClick={() => onUpdate(comp.id, { pressed: !comp.pressed })}
          style={{
            ...btn, padding: '11px 8px', fontWeight: 600, fontSize: '0.85rem',
            background: comp.pressed ? '#14532d' : '#262626',
            border: `1px solid ${comp.pressed ? '#22c55e' : '#3d3d3d'}`,
            color: comp.pressed ? '#9af5b8' : '#e6e6e6',
          }}
        >
          <CircleDot size={16} /> {comp.pressed ? 'Pressed — tap to release' : 'Released — tap to press'}
        </button>
      )}
      {comp.type === 'PowerSupply' && (
        <button
          onClick={() => onUpdate(comp.id, { on: !on })}
          style={{
            ...btn, padding: '11px 8px', fontWeight: 600, fontSize: '0.85rem',
            background: on ? '#14532d' : '#3a1a1a',
            border: `1px solid ${on ? '#22c55e' : '#7a3a3a'}`,
            color: on ? '#9af5b8' : '#ffaaaa',
          }}
        >
          <Power size={16} /> Output {on ? 'ON — tap to switch off' : 'OFF — tap to switch on'}
        </button>
      )}

      {/* values */}
      {comp.type === 'Resistor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#aaa' }}>
            Resistance
            <input
              type="number" min="1" value={comp.value ?? 1000} style={input}
              onChange={(e) => onUpdate(comp.id, { value: Math.max(Number(e.target.value) || 1, 1) })}
            />
            Ω
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {RESISTOR_PRESETS.map((r) => (
              <button key={r} onClick={() => onUpdate(comp.id, { value: r })} style={chip((comp.value ?? 1000) === r)}>
                {ohms(r)}
              </button>
            ))}
          </div>
        </div>
      )}
      {comp.type === 'PowerSupply' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#aaa' }}>
          Voltage
          <input
            type="number" min="0" max="48" step="0.5" value={comp.value ?? 5} style={input}
            onChange={(e) => onUpdate(comp.id, { value: Math.min(Math.max(Number(e.target.value) || 0, 0), 48) })}
          />
          V
        </label>
      )}
      {comp.type === 'LED' && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: '#aaa', marginRight: 2 }}>Colour</span>
          {Object.entries(LED_COLORS).map(([k, c]) => (
            <button
              key={k}
              onClick={() => onUpdate(comp.id, { color: k })}
              aria-label={c.label}
              title={`${c.label} (≈${c.vf} V)`}
              style={{
                width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', background: c.hex,
                border: (comp.color || 'red') === k ? '2px solid white' : '2px solid #2a2a2a',
              }}
            />
          ))}
        </div>
      )}

      {/* live multimeter */}
      <div style={{ background: '#0f0f0f', border: '1px solid #2c2c2c', borderRadius: 8, padding: '7px 9px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', color: '#777', marginBottom: 3 }}>
          <Gauge size={12} color="#00cc66" /> MULTIMETER
        </div>
        {reading ? (
          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: fault ? '#ff7755' : '#00cc66', lineHeight: 1.5 }}>
            {comp.type === 'Transistor' ? (
              <>
                <div>V<sub>CE</sub> {fmt(reading.v, 'V')}</div>
                <div>I<sub>C</sub> {fmt(reading.i, 'A')} · I<sub>B</sub> {fmt(reading.ib ?? 0, 'A')}</div>
                <div style={{ color: '#888' }}>{reading.mode === 'sat' ? 'fully on (saturated)' : reading.mode === 'active' ? 'amplifying (active)' : 'off'}</div>
              </>
            ) : (
              <>
                <div>V {fmt(reading.v, 'V')} · I {fmt(reading.i, 'A')}</div>
                <div style={{ color: fault ? '#ff7755' : '#3a9a6a' }}>P {fmt(Math.abs(reading.v * reading.i), 'W')}</div>
              </>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.72rem', color: '#555' }}>
            {!SIMULATED.has(comp.type)
              ? 'This part isn\'t simulated yet'
              : comp.type === 'PowerSupply' && !on
                ? 'Output is off'
                : 'No reading — add a powered supply'}
          </div>
        )}
      </div>

      {fault && (
        <div style={{
          display: 'flex', gap: 6, padding: 8, background: '#2a1212', border: '1px solid #713',
          borderRadius: 8, color: '#ff8877', fontSize: '0.72rem', lineHeight: 1.4,
        }}>
          <TriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{FAULT_MESSAGES[fault] || fault}</span>
        </div>
      )}
      {hint && !fault && (
        <div style={{
          display: 'flex', gap: 6, padding: 8, background: '#2a2410', border: '1px solid #5a4a1a',
          borderRadius: 8, color: '#ffd77a', fontSize: '0.72rem', lineHeight: 1.4,
        }}>
          <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>{hint.title}.</strong> {hint.fix}</span>
        </div>
      )}

      {/* arrange */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onMove} style={btn} title="Pick it up, then tap a hole to drop it">
          <Move size={15} /> Move
        </button>
        <button onClick={onRotate} style={btn} title="Rotate 90° (R)">
          <RotateCw size={15} /> Rotate
        </button>
        <button onClick={onDelete} style={{ ...btn, color: '#ff8877', border: '1px solid #5a2a2a', background: '#2a1616' }} title="Delete (Del)">
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </div>
  );
}
