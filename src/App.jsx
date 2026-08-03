import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import {
  Book, Monitor, Layers, PanelLeftOpen, Wrench, RotateCw, X, Trash2, CircleDot,
} from 'lucide-react';

import Breadboard from './components/Breadboard';
import { BOARD_TYPES, BOARD_TOP_Y, snapToGrid } from './lib/constants';
import { runSimulation, terminalWorldPositions, DEFAULT_VALUES } from './lib/simulate';
import ComponentPalette from './components/ComponentPalette';
import InstrumentPanel from './components/InstrumentPanel';
import Textbook from './components/Textbook';
import FaultEffects from './components/FaultEffects';
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

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

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

const chipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '9px 14px',
  background: 'rgba(18, 18, 18, 0.92)',
  border: '1px solid #3a3a3a',
  borderRadius: 999,
  color: '#eee',
  fontSize: '0.8rem',
  cursor: 'pointer',
  pointerEvents: 'auto',
  backdropFilter: 'blur(4px)',
};

export default function App() {
  const isMobile = useIsMobile();
  const [showTextbook, setShowTextbook] = useState(false);
  const [placedComponents, setPlacedComponents] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [boardType, setBoardType] = useState('HALF');
  // null = no user choice yet → default open on desktop, closed on phones so
  // the board owns the screen. A user's explicit toggle wins thereafter.
  const [paletteChoice, setPaletteChoice] = useState(null);
  const [rightChoice, setRightChoice] = useState(null);
  const paletteOpen = paletteChoice ?? !isMobile;
  const rightOpen = rightChoice ?? !isMobile;
  const setPaletteOpen = setPaletteChoice;
  const setRightOpen = setRightChoice;
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
  const faultIds = Object.keys(sim.faults || {});

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

  const rotateSelected = useCallback(() => {
    if (selectedId === null) return;
    setPlacedComponents((prev) => prev.map((c) =>
      c.id === selectedId ? { ...c, rotation: c.rotation + Math.PI / 2 } : c));
  }, [selectedId]);

  const handlePaletteSelect = useCallback((type) => {
    setSelectedType((prev) => (prev === type ? null : type));
    setSelectedId(null);
    setHoverCell(null);
    rotatePlacement(0);
    if (isMobile) setPaletteOpen(false); // reveal the board for placement
  }, [rotatePlacement, isMobile, setPaletteOpen]);

  const updateComponent = useCallback((id, patch) => {
    setPlacedComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const stopPlacing = useCallback(() => {
    setSelectedType(null);
    setHoverCell(null);
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
        if (selectedId !== null) rotateSelected();
        else rotatePlacement((r) => r + Math.PI / 2);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, removeSelected, rotateSelected, rotatePlacement]);

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
    ? `Placing ${selectedType} — tap the board to drop it`
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

        {faultIds.map((id) => {
          const comp = placedComponents.find((c) => c.id === id);
          return comp ? <FaultEffects key={id} position={comp.position} kind={sim.faults[id]} /> : null;
        })}

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

      {/* UI overlays — the layer and layout rows pass pointer events through to
          the canvas; panels and buttons re-enable them individually. */}
      <div className="ui-layer" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top Header */}
        <div style={{
          background: 'rgba(15, 15, 15, 0.98)',
          color: 'white',
          padding: isMobile ? '8px 10px' : '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #222',
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{ background: '#3b82f6', padding: '6px', borderRadius: '6px', display: 'flex' }}>
              <Monitor size={18} color="white" />
            </div>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
              OpenCircuitry
              {!isMobile && <span style={{ color: '#444', fontWeight: 400 }}> | Virtual Electronics Lab</span>}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#1a1a1a', borderRadius: '6px', padding: '2px 8px', border: '1px solid #333' }}>
              <Layers size={14} color="#666" style={{ marginRight: '6px' }} />
              <select
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#eee',
                  border: 'none',
                  padding: '6px 0',
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
              onClick={() => {
                setShowTextbook((v) => {
                  const next = !v;
                  if (next) setRightOpen(true);
                  return next;
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '8px' : '7px 14px',
                cursor: 'pointer',
                backgroundColor: showTextbook ? '#3b82f6' : '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <Book size={16} />
              {!isMobile && (showTextbook ? 'Hide Textbook' : 'Lab Textbook')}
            </button>
          </div>
        </div>

        {/* Main area: canvas shows through; drawers slide over it */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Left drawer — component palette */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            zIndex: 20,
            display: 'flex',
            transform: paletteOpen ? 'translateX(0)' : 'translateX(-110%)',
            transition: 'transform 0.25s ease',
            pointerEvents: paletteOpen ? 'auto' : 'none',
          }}>
            <ComponentPalette
              onSelect={handlePaletteSelect}
              selectedType={selectedType}
              onRemove={removeSelected}
              hasSelection={selectedId !== null}
              onClose={() => setPaletteOpen(false)}
            />
          </div>

          {/* Right drawer — textbook or inspector/instruments */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            zIndex: 20,
            display: 'flex',
            transform: rightOpen ? 'translateX(0)' : 'translateX(110%)',
            transition: 'transform 0.25s ease',
            pointerEvents: rightOpen ? 'auto' : 'none',
          }}>
            {showTextbook ? (
              <div style={{ width: 'min(480px, 92vw)', height: '100%', background: 'rgba(15,15,15,0.97)', borderLeft: '1px solid #222', position: 'relative' }}>
                <button
                  onClick={() => setRightOpen(false)}
                  style={{ ...chipStyle, position: 'absolute', top: 8, right: 8, zIndex: 2, padding: 8 }}
                  aria-label="Close textbook"
                >
                  <X size={16} />
                </button>
                <Textbook />
              </div>
            ) : (
              <InstrumentPanel
                selected={selectedComponent}
                reading={selectedComponent ? sim.readings[selectedComponent.id] : null}
                fault={selectedComponent ? (sim.faults || {})[selectedComponent.id] : null}
                onUpdate={updateComponent}
                onRotate={rotateSelected}
                onDelete={removeSelected}
                onClose={() => setRightOpen(false)}
              />
            )}
          </div>

          {/* Floating openers when drawers are closed */}
          {!paletteOpen && (
            <button onClick={() => setPaletteOpen(true)} style={{ ...chipStyle, position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
              <PanelLeftOpen size={16} /> Parts
            </button>
          )}
          {!rightOpen && (
            <button onClick={() => setRightOpen(true)} style={{ ...chipStyle, position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
              <Wrench size={16} /> {showTextbook ? 'Textbook' : 'Tools'}
              {selectedComponent && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6' }} />}
            </button>
          )}

          {/* Floating action chips (touch-friendly; no keyboard needed) */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            zIndex: 15,
          }}>
            {selectedType && (
              <>
                <span style={{ ...chipStyle, cursor: 'default', color: '#3b82f6', borderColor: '#2a4a7a' }}>
                  Placing {selectedType}
                </span>
                <button onClick={() => rotatePlacement((r) => r + Math.PI / 2)} style={chipStyle} aria-label="Rotate placement">
                  <RotateCw size={16} />
                </button>
                <button onClick={stopPlacing} style={chipStyle} aria-label="Stop placing">
                  <X size={16} />
                </button>
              </>
            )}
            {!selectedType && selectedComponent && (
              <>
                <button onClick={rotateSelected} style={chipStyle}>
                  <RotateCw size={16} /> Rotate
                </button>
                {selectedComponent.type === 'Switch' && (
                  <button
                    onClick={() => updateComponent(selectedComponent.id, { pressed: !selectedComponent.pressed })}
                    style={{ ...chipStyle, ...(selectedComponent.pressed ? { background: '#7a2222', borderColor: '#a33' } : {}) }}
                  >
                    <CircleDot size={16} /> {selectedComponent.pressed ? 'Release' : 'Press'}
                  </button>
                )}
                <button onClick={removeSelected} style={{ ...chipStyle, color: '#ff7777' }}>
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div style={{
          background: 'rgba(10, 10, 10, 0.95)',
          color: '#555',
          padding: isMobile ? '6px 10px' : '6px 20px',
          fontSize: '0.72rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          borderTop: '1px solid #222',
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ whiteSpace: 'nowrap' }}>Objects: {placedComponents.length}</span>
            {!isMobile && <span style={{ color: '#888', whiteSpace: 'nowrap' }}>{hint}</span>}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', whiteSpace: 'nowrap' }}>
            {faultIds.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ff5544' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5544' }} />
                {faultIds.length} fault{faultIds.length > 1 ? 's' : ''}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: sim.status === 'ok' ? '#00cc66' : '#666' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sim.status === 'ok' ? '#00cc66' : '#444' }} />
              {sim.status === 'ok' ? `Simulating · ${sim.nodes + 1} nodes` : (isMobile ? 'No power' : 'Add a DC power supply to simulate')}
            </span>
            {!isMobile && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3b82f6' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} /> {board.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
