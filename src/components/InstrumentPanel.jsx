import { MousePointerClick, Gauge, Activity, AudioWaveform } from 'lucide-react';

const TYPE_LABELS = {
  Resistor: 'Resistor', LED: 'LED (Red)', Capacitor: 'Capacitor', Diode: 'Diode (1N4001)',
  Transistor: 'Transistor (NPN)', IC: 'IC (555 Timer)', Switch: 'Push Button',
  PowerSupply: 'DC Power Supply', Antenna: 'Antenna', Magnet: 'Magnet', Wire: 'Jumper Wire',
};

export default function InstrumentPanel({ selected }) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gauge size={14} /> <span>Multimeter</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#444' }}>coming soon</span>
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
    </div>
  );
}
