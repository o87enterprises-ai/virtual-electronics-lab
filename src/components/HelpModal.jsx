import { X, MousePointerClick, Move, Spline, Gauge, Flame, Rotate3D, Lightbulb, Power } from 'lucide-react';

const Row = ({ icon, title, children }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <div style={{ background: '#1e2a3f', color: '#6aa2ff', borderRadius: 8, padding: 8, display: 'flex', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <strong style={{ fontSize: '0.85rem' }}>{title}</strong>
      <p style={{ fontSize: '0.76rem', color: '#999', margin: '3px 0 0', lineHeight: 1.5 }}>{children}</p>
    </div>
  </div>
);

export default function HelpModal({ onClose, onOpenProjects }) {
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
          width: 'min(520px, 96vw)', maxHeight: '88vh', overflowY: 'auto',
          background: '#141414', border: '1px solid #333', borderRadius: 12,
          color: 'white', padding: 22, display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Welcome to OpenCircuitry</h2>
            <p style={{ color: '#888', fontSize: '0.8rem', margin: '4px 0 0' }}>
              A 3D electronics lab with a real DC circuit simulator. Here&apos;s the 60-second tour:
            </p>
          </div>
          <button onClick={onClose} aria-label="Close help" style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 8, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <Row icon={<MousePointerClick size={16} />} title="Place parts">
          Open <em>Parts</em>, pick a component, then tap any breadboard hole to drop it.
          Keep tapping to place more; press the ✕ chip (or Esc) to stop. R rotates before placing.
        </Row>
        <Row icon={<Move size={16} />} title="Select, then choose an action">
          Tap a part to select it — touching a part never moves it. Buttons appear
          under the board: <strong>Move</strong> (arms dragging, or tap a hole to send
          it there), <strong>Rotate</strong>, <strong>Action</strong>, and Delete.
        </Row>
        <Row icon={<Power size={16} />} title="Using a part">
          <strong>Action</strong> is how you operate something: it presses and releases
          a push button, and switches the power supply&apos;s output on and off. Parts with
          nothing to actuate simply have no Action button.
        </Row>
        <Row icon={<Spline size={16} />} title="Magnetic wiring">
          Pick <em>Jumper Wire</em> and every terminal on the board lights up — red for
          +, blue for −. Tap one, then tap another: the wire snaps onto both and routes
          itself around anything in between, bending at right angles. Green rings mark
          holes where leads genuinely meet, so you can see a connection took.
        </Row>
        <Row icon={<Gauge size={16} />} title="It's always simulating">
          Add a DC power supply (red post = +, black = −) and the whole board is solved
          live. Select any part to read its voltage, current, and power on the multimeter
          in <em>Tools</em>. Resistor and supply values are editable there too.
        </Row>
        <Row icon={<Flame size={16} />} title="Break things (safely)">
          Exceed a part&apos;s ratings — short the supply, skip an LED&apos;s resistor, reverse an
          electrolytic cap — and it goes up in smoke and sparks, with the reason in the inspector.
        </Row>
        <Row icon={<Rotate3D size={16} />} title="Camera">
          One finger / left-drag rotates, two fingers / right-drag pans, pinch or scroll zooms.
        </Row>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onOpenProjects}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px', background: '#1a1a1a', border: '1px solid #3b82f6', borderRadius: 8,
              color: '#6aa2ff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            }}
          >
            <Lightbulb size={16} /> Guided projects
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', background: '#3b82f6', border: 'none', borderRadius: 8,
              color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            }}
          >
            Start building
          </button>
        </div>
      </div>
    </div>
  );
}
