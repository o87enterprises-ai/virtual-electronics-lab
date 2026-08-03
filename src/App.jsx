import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Book, Monitor, Layers } from 'lucide-react';

import Breadboard from './components/Breadboard';
import { BOARD_TYPES, BOARD_TOP_Y, snapToGrid } from './lib/constants';
import { runSimulation, terminalWorldPositions, DEFAULT_VALUES } from './lib/simulate';
import ComponentPalette from './components/ComponentPalette';
import InstrumentPanel from './components/InstrumentPanel';
import Textbook from './components/Textbook';
import {
  Resistor, LED, Capacitor, Diode, Transistor,
  IntegratedCircuit, Switch, PowerSupply, Antenna, Magnet, Wire,
} from './components/InteractiveComponents';

// Height of each component's origin above the board so it sits on the surface
// with its legs in the holes.
const Y_OFFSET = {
  Resistor: 0.02, LED: 0.025, Capacitor: 0.04, Diode: 0.02, Transistor: 0.05,
  IC: 0.025, Switch: 0.02, PowerSupply: 0.1, Antenna: 0.2, Magnet: 0.025, Wire: 0.005,
};

const restY = (type) => BOARD_TOP_Y + (Y_OFFSET[type] ?? 0.03);

const COMPONENT_VISUALS = {
  Resistor, LED, Capacitor, Diode, Transistor,
  IC: IntegratedCircuit, Switch, PowerSupply, Antenna, Magnet, Wire,
};

// While a drag is active, project pointer moves onto a horizontal plane at the
// dragged component's height. Window-level listeners keep the drag alive even
// when the pointer leaves the component or the canvas.
function DragController({ active, planeY, onDrag, onEnd }) {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!active) return;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();

    const onMove = (ev) => {
      const rect = gl.domElement.getBoundingClientRect();
      ndc.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) onDrag(hit);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
    };
  }, [active, planeY, camera, gl, onDrag, onEnd]);

  return null;
}

export default function App() {
  const [showTextbook, setShowTextbook] = useState(false);
  const [placedComponents, setPlacedComponents] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [boardType, setBoardType] = useState('HALF');
  const [placementRotation, setPlacementRotation] = useState(0);
  // Mirror of placementRotation read inside canvas event handlers: the three.js
  // scene commits on its own schedule, so a captured prop can be stale for a
  // beat after pressing R — the ref is always current.
  const placementRotationRef = useRef(0);
  const rotatePlacement = useCallback((value) => {
    placementRotationRef.current = typeof value === 'function' ? value(placementRotationRef.current) : value;
    setPlacementRotation(placementRotationRef.current);
  }, []);
  // x/z offset between the grab point and the component origin, so a part
  // doesn't jump to the cursor when picked up
  const dragOffset = useRef([0, 0]);

  const board = BOARD_TYPES[boardType] || BOARD_TYPES.HALF;
  const selectedComponent = placedComponents.find((c) => c.id === selectedId) || null;
  const dragComponent = placedComponents.find((c) => c.id === dragId) || null;

  const sim = useMemo(() => runSimulation(placedComponents), [placedComponents]);

  const handleBoardClick = useCallback((point) => {
    if (selectedType) {
      const [x, z] = snapToGrid(point, board);
      setPlacedComponents((prev) => [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: selectedType,
        position: [x, restY(selectedType), z],
        rotation: placementRotationRef.current,
        ...(DEFAULT_VALUES[selectedType] !== undefined ? { value: DEFAULT_VALUES[selectedType] } : {}),
        ...(selectedType === 'Switch' ? { pressed: false } : {}),
      }]);
      // selectedType stays active so several parts can be placed in a row
    } else {
      setSelectedId(null);
    }
  }, [selectedType, board]);

  const handleBoardHover = useCallback((point) => {
    if (!selectedType) return;
    const [x, z] = snapToGrid(point, board);
    setHoverCell((prev) =>
      prev && prev[0] === x && prev[2] === z ? prev : [x, BOARD_TOP_Y + 0.015, z]);
  }, [selectedType, board]);

  const handleDrag = useCallback((point) => {
    if (dragId === null) return;
    const [ox, oz] = dragOffset.current;
    const [x, z] = snapToGrid({ x: point.x + ox, z: point.z + oz }, board);
    setPlacedComponents((prev) => prev.map((c) =>
      c.id === dragId && (c.position[0] !== x || c.position[2] !== z)
        ? { ...c, position: [x, c.position[1], z] }
        : c));
  }, [dragId, board]);

  const endDrag = useCallback(() => setDragId(null), []);

  const removeSelected = useCallback(() => {
    if (selectedId === null) return;
    setPlacedComponents((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const handlePaletteSelect = useCallback((type) => {
    setSelectedType((prev) => (prev === type ? null : type));
    setSelectedId(null);
    setHoverCell(null);
    rotatePlacement(0);
  }, [rotatePlacement]);

  const updateComponent = useCallback((id, patch) => {
    setPlacedComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'Escape') {
        setSelectedType(null);
        setSelectedId(null);
        setHoverCell(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        e.preventDefault();
        removeSelected();
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedId !== null) {
          setPlacedComponents((prev) => prev.map((c) =>
            c.id === selectedId ? { ...c, rotation: c.rotation + Math.PI / 2 } : c));
        } else {
          rotatePlacement((r) => r + Math.PI / 2);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, removeSelected, rotatePlacement]);

  const renderComponent = (comp) => {
    const Visual = COMPONENT_VISUALS[comp.type];
    if (!Visual) return null;
    return (
      <group
        key={comp.id}
        position={comp.position}
        rotation={[0, comp.rotation || 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          dragOffset.current = [comp.position[0] - e.point.x, comp.position[2] - e.point.z];
          setSelectedId(comp.id);
          setDragId(comp.id);
          document.body.style.cursor = 'grabbing';
          // End the drag on the raw DOM event: waiting for a React effect to
          // attach this listener can miss the release of a quick click,
          // leaving the part glued to the cursor.
          const end = () => {
            setDragId(null);
            document.body.style.cursor = 'auto';
          };
          window.addEventListener('pointerup', end, { once: true });
          window.addEventListener('pointercancel', end, { once: true });
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (comp.type === 'Switch') updateComponent(comp.id, { pressed: !comp.pressed });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (dragId === null) document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          if (dragId === null) document.body.style.cursor = 'auto';
        }}
      >
        <Visual
          selected={selectedId === comp.id}
          {...(comp.type === 'LED' ? { color: 'red', current: sim.readings[comp.id]?.i ?? 0 } : {})}
          {...(comp.type === 'Switch' ? { pressed: !!comp.pressed } : {})}
        />
      </group>
    );
  };

  const hint = selectedType
    ? `Placing ${selectedType} — click the board · R = rotate · Esc = stop`
    : selectedId !== null
      ? 'Drag to move · R = rotate · Delete = remove · double-click a button to press it'
      : 'Pick a component, then click the board · drag placed parts to move them';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a' }}>
      <Canvas shadows onPointerUp={() => { document.body.style.cursor = 'auto'; }}>
        <PerspectiveCamera makeDefault position={[0.6, 0.6, 0.6]} fov={40} />
        <color attach="background" args={['#0a0a0a']} />

        <ambientLight intensity={0.5} />
        <spotLight position={[5, 5, 5]} angle={0.2} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4488ff" />

        <Breadboard
          type={boardType}
          onClick={handleBoardClick}
          onHover={handleBoardHover}
          onHoverEnd={() => setHoverCell(null)}
        />
        {placedComponents.map(renderComponent)}

        {selectedType && hoverCell && (
          <mesh position={hoverCell} rotation={[0, placementRotation, 0]}>
            <boxGeometry args={[0.14, 0.02, 0.045]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} depthWrite={false} />
          </mesh>
        )}

        {/* Terminal markers for the selected component */}
        {selectedComponent && terminalWorldPositions(selectedComponent, BOARD_TOP_Y + 0.005).map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshBasicMaterial color={i === 0 ? '#ff5555' : '#5599ff'} depthWrite={false} transparent opacity={0.9} />
          </mesh>
        ))}

        <DragController
          active={dragId !== null}
          planeY={dragComponent ? dragComponent.position[1] : 0}
          onDrag={handleDrag}
          onEnd={endDrag}
        />

        <ContactShadows position={[0, -0.1, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />
        <OrbitControls
          makeDefault
          enabled={dragId === null}
          enableDamping
          dampingFactor={0.05}
          minDistance={0.2}
          maxDistance={5}
          maxPolarAngle={Math.PI / 2}
        />
        <gridHelper args={[10, 40, 0x151515, 0x111111]} position={[0, -0.11, 0]} />
      </Canvas>

      {/* UI overlays — the layer itself and layout rows let pointer events pass
          through to the canvas; only the actual panels re-enable them. */}
      <div className="ui-layer" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top Header */}
        <div style={{
          background: 'rgba(15, 15, 15, 0.98)',
          color: 'white',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #222',
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#3b82f6', padding: '6px', borderRadius: '6px' }}>
              <Monitor size={20} color="white" />
            </div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              OpenCircuitry <span style={{ color: '#444', fontWeight: 400 }}>| Virtual Electronics Lab</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#1a1a1a', borderRadius: '6px', padding: '2px 8px', border: '1px solid #333' }}>
              <Layers size={14} color="#666" style={{ marginRight: '8px' }} />
              <select
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#eee',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="MINI">Mini (170)</option>
                <option value="HALF">Half (400)</option>
                <option value="FULL">Full (830)</option>
              </select>
            </div>

            <button
              onClick={() => setShowTextbook(!showTextbook)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                cursor: 'pointer',
                backgroundColor: showTextbook ? '#3b82f6' : '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              <Book size={16} />
              {showTextbook ? 'Hide Textbook' : 'Lab Textbook'}
            </button>
          </div>
        </div>

        {/* Main Content Area — pointer events stay off so the canvas underneath
            receives clicks; each side panel re-enables them for itself. */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ComponentPalette
            onSelect={handlePaletteSelect}
            selectedType={selectedType}
            onRemove={removeSelected}
            hasSelection={selectedId !== null}
          />

          <div style={{ flex: 1 }} />

          {showTextbook ? (
            <div style={{ width: '480px', height: '100%', pointerEvents: 'auto', borderLeft: '1px solid #222' }}>
              <Textbook />
            </div>
          ) : (
            <InstrumentPanel
              selected={selectedComponent}
              reading={selectedComponent ? sim.readings[selectedComponent.id] : null}
              onUpdate={updateComponent}
            />
          )}
        </div>

        {/* Bottom Status Bar */}
        <div style={{
          background: 'rgba(10, 10, 10, 0.95)',
          color: '#555',
          padding: '6px 20px',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #222',
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Objects: {placedComponents.length}</span>
            <span style={{ color: '#888' }}>{hint}</span>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span>Rotate (Left) · Pan (Right) · Zoom (Scroll)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: sim.status === 'ok' ? '#00cc66' : '#666' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: sim.status === 'ok' ? '#00cc66' : '#444' }} />
              {sim.status === 'ok' ? `Simulating · ${sim.nodes + 1} nodes` : 'Add a DC power supply to simulate'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} /> {board.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
