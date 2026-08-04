import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import {
  Book, Monitor, Layers, PanelLeftOpen, Wrench, RotateCw, X, Trash2, CircleDot,
  Lightbulb, CircleHelp, Move, Power,
} from 'lucide-react';

import Breadboard from './components/Breadboard';
import { BOARD_TYPES, BOARD_TOP_Y, snapToGrid } from './lib/constants';
import { runSimulation, terminalWorldPositions, DEFAULT_VALUES } from './lib/simulate';
import {
  blockedCells, routeCells, terminalTargets, junctionCells, wireRenderPath,
} from './lib/routing';
import ComponentPalette from './components/ComponentPalette';
import InstrumentPanel from './components/InstrumentPanel';
import Textbook from './components/Textbook';
import FaultEffects from './components/FaultEffects';
import HelpModal from './components/HelpModal';
import ProjectsModal from './components/ProjectsModal';
import { PITCH } from './lib/constants';
import {
  Resistor, LED, Capacitor, Diode, Transistor,
  IntegratedCircuit, Switch, PowerSupply, Antenna, Magnet, Wire,
} from './components/InteractiveComponents';

// Height of each component's origin above the board so it sits on the surface
// with its legs in the holes.
const Y_OFFSET = {
  Resistor: 0.02, LED: 0.025, Capacitor: 0.04, Diode: 0.02, Transistor: 0.05,
  IC: 0.025, Switch: 0.02, PowerSupply: 0.055, Antenna: 0.2, Magnet: 0.025, Wire: 0.005,
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

// Exposes the live three.js state (camera, renderer, controls) to DOM-side
// handlers, so drags can attach their listeners imperatively at pointerdown
// instead of waiting on a canvas-side React effect that can commit late.
function CanvasBridge({ ctxRef }) {
  const three = useThree();
  useEffect(() => { ctxRef.current = three; });
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
  // Movement is an explicit mode, not something a stray touch can trigger.
  const [moveMode, setMoveMode] = useState(false);
  const moveModeRef = useRef(false);
  const setMove = useCallback((v) => {
    moveModeRef.current = v;
    setMoveMode(v);
  }, []);
  // Mirror of selectedId for canvas handlers (same staleness reason as above):
  // a part only drags when it was already selected before the touch.
  const selectedIdRef = useRef(null);
  const selectPart = useCallback((id) => {
    selectedIdRef.current = id;
    setSelectedId(id);
    // a new selection always starts out un-armed for movement
    setMove(false);
  }, [setMove]);
  // Same again for the palette pick and board size, so the board's click
  // handler never acts on a stale placement mode.
  const selectedTypeRef = useRef(null);
  const selectType = useCallback((v) => {
    const next = typeof v === 'function' ? v(selectedTypeRef.current) : v;
    selectedTypeRef.current = next;
    setSelectedType(next);
  }, []);
  const boardRef = useRef(null);
  // First tap of a two-tap wire placement (world [x, z]); ref for canvas handlers.
  const [wireStart, setWireStart] = useState(null);
  const wireStartRef = useRef(null);
  const setWireStartBoth = useCallback((v) => {
    wireStartRef.current = v;
    setWireStart(v);
  }, []);
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem('oc-welcome-seen'));
  const [showProjects, setShowProjects] = useState(false);
  const closeHelp = useCallback(() => {
    localStorage.setItem('oc-welcome-seen', '1');
    setShowHelp(false);
  }, []);

  const board = BOARD_TYPES[boardType] || BOARD_TYPES.HALF;
  useEffect(() => { boardRef.current = board; }, [board]);
  const selectedComponent = placedComponents.find((c) => c.id === selectedId) || null;
  const canvasCtxRef = useRef(null);

  const sim = useMemo(() => runSimulation(placedComponents), [placedComponents]);
  const faultIds = Object.keys(sim.faults || {});

  // Solder points and real junctions, recomputed as the board changes.
  const snapTargets = useMemo(() => terminalTargets(placedComponents), [placedComponents]);
  const junctions = useMemo(() => junctionCells(placedComponents), [placedComponents]);
  const wireObstacles = useMemo(() => blockedCells(placedComponents), [placedComponents]);
  const snapTargetsRef = useRef(snapTargets);
  useEffect(() => { snapTargetsRef.current = snapTargets; }, [snapTargets]);

  // Magnetic snap: a tap near a component's terminal grabs that terminal
  // rather than the raw hole under the cursor.
  const SNAP_RADIUS = PITCH * 1.6;
  const snapPoint = useCallback((point, brd) => {
    let best = null;
    for (const t of snapTargetsRef.current) {
      const d = Math.hypot(t.world[0] - point.x, t.world[1] - point.z);
      if (d <= SNAP_RADIUS && (!best || d < best.d)) best = { d, t };
    }
    if (best) return { pos: best.t.world, target: best.t };
    const [x, z] = snapToGrid(point, brd);
    return { pos: [x, z], target: null };
  }, [SNAP_RADIUS]);

  // Reads every bit of placement context from refs: the three.js scene can
  // deliver events to a handler from a slightly older commit, so captured
  // props here would intermittently be one interaction behind.
  const handleBoardClick = useCallback((point) => {
    const type = selectedTypeRef.current;
    const brd = boardRef.current || BOARD_TYPES.HALF;
    if (type === 'Wire') {
      // Two taps, each magnetically snapped to the nearest terminal: the wire
      // then auto-routes around whatever sits between the two points.
      const { pos } = snapPoint(point, brd);
      const start = wireStartRef.current;
      if (!start) {
        setWireStartBoth(pos);
      } else if (start[0] !== pos[0] || start[1] !== pos[1]) {
        setPlacedComponents((prev) => [...prev, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'Wire',
          position: [start[0], restY('Wire'), start[1]],
          end: pos,
          rotation: 0,
        }]);
        setWireStartBoth(null);
      }
    } else if (type) {
      const [x, z] = snapToGrid(point, brd);
      setPlacedComponents((prev) => [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        position: [x, restY(type), z],
        rotation: placementRotationRef.current,
        ...(DEFAULT_VALUES[type] !== undefined ? { value: DEFAULT_VALUES[type] } : {}),
        ...(type === 'Switch' ? { pressed: false } : {}),
        ...(type === 'PowerSupply' ? { on: true } : {}),
      }]);
      // the picked type stays active so several parts can be placed in a row
    } else if (moveModeRef.current && selectedIdRef.current !== null) {
      // Move mode: tapping a hole relocates the selected part there — the
      // touch-friendly alternative to dragging.
      const [x, z] = snapToGrid(point, brd);
      const id = selectedIdRef.current;
      setPlacedComponents((prev) => prev.map((c) => {
        if (c.id !== id) return c;
        const moved = { ...c, position: [x, c.position[1], z] };
        if (c.end) moved.end = [c.end[0] + (x - c.position[0]), c.end[1] + (z - c.position[2])];
        return moved;
      }));
    } else {
      selectPart(null);
    }
  }, [setWireStartBoth, selectPart, snapPoint]);

  const handleBoardHover = useCallback((point) => {
    const type = selectedTypeRef.current;
    if (!type && !moveModeRef.current) return;
    const brd = boardRef.current || BOARD_TYPES.HALF;
    if (type === 'Wire') {
      const { pos, target } = snapPoint(point, brd);
      setHoverCell((prev) =>
        prev && prev[0] === pos[0] && prev[2] === pos[1] && prev[3] === (target?.compId ?? null)
          ? prev
          : [pos[0], BOARD_TOP_Y + 0.015, pos[1], target?.compId ?? null]);
      return;
    }
    const [x, z] = snapToGrid(point, brd);
    setHoverCell((prev) =>
      prev && prev[0] === x && prev[2] === z ? prev : [x, BOARD_TOP_Y + 0.015, z]);
  }, [snapPoint]);

  const dragTo = useCallback((id, point) => {
    const [ox, oz] = dragOffset.current;
    const [x, z] = snapToGrid({ x: point.x + ox, z: point.z + oz }, boardRef.current || BOARD_TYPES.HALF);
    setPlacedComponents((prev) => prev.map((c) => {
      if (c.id !== id || (c.position[0] === x && c.position[2] === z)) return c;
      const moved = { ...c, position: [x, c.position[1], z] };
      if (c.end) moved.end = [c.end[0] + (x - c.position[0]), c.end[1] + (z - c.position[2])];
      return moved;
    }));
  }, []);

  // Starts a drag entirely with DOM listeners: raycast pointer moves onto a
  // horizontal plane at the part's height and move the part along it.
  const beginDrag = useCallback((comp, e) => {
    const ctx = canvasCtxRef.current;
    if (!ctx) return;
    dragOffset.current = [comp.position[0] - e.point.x, comp.position[2] - e.point.z];
    setDragId(comp.id);
    if (ctx.controls) ctx.controls.enabled = false;
    document.body.style.cursor = 'grabbing';

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -comp.position[1]);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();
    const onMove = (ev) => {
      const rect = ctx.gl.domElement.getBoundingClientRect();
      ndc.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, ctx.camera);
      if (raycaster.ray.intersectPlane(plane, hit)) dragTo(comp.id, hit);
    };
    const end = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointercancel', end);
      setDragId(null);
      if (ctx.controls) ctx.controls.enabled = true;
      document.body.style.cursor = 'auto';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', end, { once: true });
    window.addEventListener('pointercancel', end);
  }, [dragTo]);

  const removeSelected = useCallback(() => {
    if (selectedId === null) return;
    setPlacedComponents((prev) => prev.filter((c) => c.id !== selectedId));
    selectPart(null);
  }, [selectedId, selectPart]);

  const rotateSelected = useCallback(() => {
    if (selectedId === null) return;
    setPlacedComponents((prev) => prev.map((c) => {
      if (c.id !== selectedId) return c;
      // Variable wires rotate their end around the start hole.
      if (c.end) {
        const dx = c.end[0] - c.position[0];
        const dz = c.end[1] - c.position[2];
        return { ...c, end: [c.position[0] + dz, c.position[2] - dx] };
      }
      return { ...c, rotation: c.rotation + Math.PI / 2 };
    }));
  }, [selectedId]);

  const handlePaletteSelect = useCallback((type) => {
    selectType((prev) => (prev === type ? null : type));
    selectPart(null);
    setHoverCell(null);
    setWireStartBoth(null);
    rotatePlacement(0);
    if (isMobile) setPaletteOpen(false); // reveal the board for placement
  }, [rotatePlacement, isMobile, setPaletteOpen, selectPart, selectType, setWireStartBoth]);

  const updateComponent = useCallback((id, patch) => {
    setPlacedComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  // What "Action" does depends on the part: buttons press, supplies switch on
  // and off. Parts with nothing to actuate report null and hide the button.
  const actionFor = (comp) => {
    if (!comp) return null;
    if (comp.type === 'Switch') {
      return {
        label: comp.pressed ? 'Release' : 'Press',
        active: !!comp.pressed,
        icon: <CircleDot size={16} />,
        run: () => updateComponent(comp.id, { pressed: !comp.pressed }),
      };
    }
    if (comp.type === 'PowerSupply') {
      const on = comp.on !== false;
      return {
        label: on ? 'Turn Off' : 'Turn On',
        active: on,
        icon: <Power size={16} />,
        run: () => updateComponent(comp.id, { on: !on }),
      };
    }
    return null;
  };
  const selectedAction = actionFor(selectedComponent);

  const stopPlacing = useCallback(() => {
    selectType(null);
    setHoverCell(null);
    setWireStartBoth(null);
  }, [selectType, setWireStartBoth]);

  // Clear the board and build a guided project in its place.
  const loadProject = useCallback((project) => {
    setPlacedComponents(project.parts.map((p, i) => ({
      id: `proj-${project.id}-${i}-${Date.now()}`,
      type: p.type,
      position: [p.at[0] * PITCH, restY(p.type), p.at[1] * PITCH],
      rotation: p.rotation || 0,
      ...(p.to ? { end: [p.to[0] * PITCH, p.to[1] * PITCH] } : {}),
      ...(p.value !== undefined ? { value: p.value } : {}),
      ...(p.pressed !== undefined ? { pressed: p.pressed } : {}),
    })));
    setBoardType('HALF');
    selectType(null);
    selectPart(null);
    setWireStartBoth(null);
    setShowProjects(false);
    closeHelp();
  }, [selectPart, selectType, setWireStartBoth, closeHelp]);

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'Escape') {
        selectType(null);
        selectPart(null);
        setHoverCell(null);
        setWireStartBoth(null);
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
  }, [selectedId, removeSelected, rotateSelected, rotatePlacement, selectPart, selectType, setWireStartBoth]);

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
          // Touching a part only ever selects it. Dragging is possible solely
          // while Move is armed for that part, so browsing a circuit can never
          // rearrange it by accident.
          if (selectedIdRef.current !== comp.id) {
            selectPart(comp.id);
            return;
          }
          if (moveModeRef.current) beginDrag(comp, e);
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
          {...(comp.type === 'PowerSupply' ? { on: comp.on !== false } : {})}
          {...(comp.type === 'Wire' ? { path: wireRenderPath(comp, placedComponents) } : {})}
        />
      </group>
    );
  };

  // Junction rings stay on while a wire is selected, so you can confirm a
  // connection landed without re-entering the wire tool.
  const showJunctions = selectedComponent?.type === 'Wire';

  const hint = selectedType === 'Wire'
    ? (wireStart
      ? 'Now tap the second terminal — the wire routes itself around anything between'
      : 'Tap a red (+) or blue (−) terminal to start the wire')
    : selectedType
      ? `Placing ${selectedType} — tap the board to drop it`
      : moveMode
        ? 'Move mode: drag the part, or tap a hole to send it there'
        : selectedId !== null
          ? 'Use Move, Rotate or Action below · Delete removes'
          : 'Pick a component, then tap the board · tap a placed part to select it';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a' }}>
      <Canvas shadows onPointerUp={() => { document.body.style.cursor = 'auto'; }}>
        <PerspectiveCamera makeDefault position={[0.6, 0.6, 0.6]} fov={40} />
        <color attach="background" args={['#0a0a0a']} />

        <ambientLight intensity={0.75} />
        <hemisphereLight args={['#8899bb', '#332222', 0.5]} />
        <spotLight position={[5, 5, 5]} angle={0.25} penumbra={1} intensity={2} castShadow />
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

        {selectedType && selectedType !== 'Wire' && hoverCell && (
          <mesh position={hoverCell} rotation={[0, placementRotation, 0]}>
            <boxGeometry args={[0.14, 0.02, 0.045]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} depthWrite={false} />
          </mesh>
        )}
        {/* Magnetic solder points, shown whenever the wire tool is active */}
        {selectedType === 'Wire' && snapTargets.map((t, i) => {
          const hot = hoverCell && Math.abs(hoverCell[0] - t.world[0]) < 1e-6
            && Math.abs(hoverCell[2] - t.world[1]) < 1e-6;
          return (
            <mesh key={`t${i}`} position={[t.world[0], BOARD_TOP_Y + 0.012, t.world[1]]}>
              <sphereGeometry args={[hot ? 0.019 : 0.012, 12, 12]} />
              <meshBasicMaterial
                color={t.polarity === '+' ? '#ff5555' : '#5599ff'}
                transparent
                opacity={hot ? 1 : 0.75}
                depthWrite={false}
              />
            </mesh>
          );
        })}

        {/* Live preview of the routed run while wiring */}
        {selectedType === 'Wire' && wireStart && (() => {
          const sy = BOARD_TOP_Y + 0.016;
          const a = [Math.round(wireStart[0] / PITCH), Math.round(wireStart[1] / PITCH)];
          const pts = hoverCell
            ? routeCells(a, [Math.round(hoverCell[0] / PITCH), Math.round(hoverCell[2] / PITCH)], wireObstacles)
            : [a];
          const world = pts.map(([i, j]) => [i * PITCH, j * PITCH]);
          const segs = [];
          for (let k = 0; k < world.length - 1; k++) {
            const [x1, z1] = world[k];
            const [x2, z2] = world[k + 1];
            const len = Math.hypot(x2 - x1, z2 - z1);
            if (len > 1e-6) {
              segs.push({ k, len, mid: [(x1 + x2) / 2, (z1 + z2) / 2], angle: Math.atan2(-(z2 - z1), x2 - x1) });
            }
          }
          return (
            <group>
              {segs.map((sg) => (
                <group key={sg.k} position={[sg.mid[0], sy, sg.mid[1]]} rotation={[0, sg.angle, 0]}>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.005, 0.005, sg.len]} />
                    <meshBasicMaterial color="#55ff55" transparent opacity={0.6} depthWrite={false} />
                  </mesh>
                </group>
              ))}
              {world.map(([x, z], k) => (
                <mesh key={`p${k}`} position={[x, sy, z]}>
                  <sphereGeometry args={[k === 0 ? 0.016 : 0.011, 12, 12]} />
                  <meshBasicMaterial color="#55ff55" transparent opacity={0.85} depthWrite={false} />
                </mesh>
              ))}
            </group>
          );
        })()}

        {/* Green rings mark holes where two or more leads actually meet */}
        {(selectedType === 'Wire' || showJunctions) && junctions.map(([i, j]) => (
          <mesh key={`j${i},${j}`} position={[i * PITCH, BOARD_TOP_Y + 0.004, j * PITCH]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.016, 0.023, 16]} />
            <meshBasicMaterial color="#22ff88" transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Terminal markers for the selected component */}
        {selectedComponent && terminalWorldPositions(selectedComponent, BOARD_TOP_Y + 0.005).map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshBasicMaterial color={i === 0 ? '#ff5555' : '#5599ff'} depthWrite={false} transparent opacity={0.9} />
          </mesh>
        ))}

        <CanvasBridge ctxRef={canvasCtxRef} />

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
            <h1 style={{
              fontSize: '0.95rem', fontWeight: 700, margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              OpenCircuitry
              {!isMobile && <span style={{ color: '#444', fontWeight: 400 }}> | Virtual Electronics Lab</span>}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => setShowProjects(true)}
              title="Guided projects"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: isMobile ? '8px' : '7px 14px', cursor: 'pointer',
                backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px',
                color: '#ffcc55', fontSize: '0.85rem', fontWeight: 500,
              }}
            >
              <Lightbulb size={16} />
              {!isMobile && 'Projects'}
            </button>
            <button
              onClick={() => setShowHelp(true)}
              title="How to use the lab"
              aria-label="Help"
              style={{
                display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer',
                backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#888',
              }}
            >
              <CircleHelp size={16} />
            </button>
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
                <span style={{ ...chipStyle, cursor: 'default', color: '#3b82f6', border: '1px solid #2a4a7a' }}>
                  {selectedType === 'Wire'
                    ? (wireStart ? 'Tap 2nd terminal' : 'Tap 1st terminal')
                    : `Placing ${selectedType}`}
                </span>
                {selectedType !== 'Wire' && (
                  <button onClick={() => rotatePlacement((r) => r + Math.PI / 2)} style={chipStyle} aria-label="Rotate placement">
                    <RotateCw size={16} />
                  </button>
                )}
                <button onClick={stopPlacing} style={chipStyle} aria-label="Stop placing">
                  <X size={16} />
                </button>
              </>
            )}
            {!selectedType && selectedComponent && (
              <>
                <button
                  onClick={() => setMove(!moveMode)}
                  style={{
                    ...chipStyle,
                    ...(moveMode
                      ? { background: '#1d4ed8', border: '1px solid #3b82f6', color: 'white' }
                      : {}),
                  }}
                >
                  <Move size={16} /> {moveMode ? 'Moving…' : 'Move'}
                </button>
                <button onClick={rotateSelected} style={chipStyle}>
                  <RotateCw size={16} /> Rotate
                </button>
                {selectedAction && (
                  <button
                    onClick={selectedAction.run}
                    style={{
                      ...chipStyle,
                      ...(selectedAction.active
                        ? { background: '#14532d', border: '1px solid #22c55e', color: '#8ef0ab' }
                        : {}),
                    }}
                  >
                    {selectedAction.icon} {selectedAction.label}
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
              {sim.status === 'ok'
                ? `Simulating · ${sim.nodes + 1} nodes`
                : sim.status === 'powered-off'
                  ? (isMobile ? 'Supply off' : 'Supply output is off — select it and press Turn On')
                  : (isMobile ? 'No power' : 'Add a DC power supply to simulate')}
            </span>
            {!isMobile && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3b82f6' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} /> {board.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {showHelp && (
        <HelpModal
          onClose={closeHelp}
          onOpenProjects={() => { closeHelp(); setShowProjects(true); }}
        />
      )}
      {showProjects && (
        <ProjectsModal onClose={() => setShowProjects(false)} onLoad={loadProject} />
      )}
    </div>
  );
}
