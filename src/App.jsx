import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Book, Monitor, Layers, PanelLeftOpen, RotateCw, X, Lightbulb, CircleHelp, Stethoscope,
  ArrowRight, CircleCheck,
} from 'lucide-react';

import Breadboard from './components/Breadboard';
import { BOARD_TYPES, BOARD_TOP_Y, snapToGrid } from './lib/constants';
import {
  runSimulation, terminalWorldPositions, terminalCells, DEFAULT_VALUES, LED_COLORS,
} from './lib/simulate';
import { checkProject, checkCircuit, projectComponents } from './lib/coach';
import {
  blockedCells, routeCells, terminalTargets, junctionCells, wireRenderPath, footprintCells,
} from './lib/routing';
import ComponentPalette from './components/ComponentPalette';
import PartMenu from './components/PartMenu';
import CoachPanel from './components/CoachPanel';
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

// Terminal marker colours: + / anode red, − / cathode blue, transistor C-B-E.
const terminalColor = (type, idx) => (type === 'Transistor'
  ? ['#ff9944', '#ffee55', '#5599ff'][idx]
  : idx === 0 ? '#ff5555' : '#5599ff');

// A breathing ring marking a hole the coach wants you to look at.
function PulseRing({ cell, color = '#ffdd33' }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + 0.35 * Math.sin(clock.getElapsedTime() * 6);
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} position={[cell[0] * PITCH, BOARD_TOP_Y + 0.006, cell[1] * PITCH]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.018, 0.028, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Translucent stand-in showing where the guide puts the next part.
function GhostPart({ comp, label }) {
  const fp = footprintCells(comp);
  const is = fp.map((c) => c[0]);
  const js = fp.map((c) => c[1]);
  const [i0, i1, j0, j1] = [Math.min(...is), Math.max(...is), Math.min(...js), Math.max(...js)];
  const center = [((i0 + i1) / 2) * PITCH, ((j0 + j1) / 2) * PITCH];
  return (
    <group>
      <mesh position={[center[0], BOARD_TOP_Y + 0.004, center[1]]}>
        <boxGeometry args={[(i1 - i0 + 0.8) * PITCH, 0.006, (j1 - j0 + 0.8) * PITCH]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {terminalCells(comp).map(([i, j], k) => (
        <PulseRing key={k} cell={[i, j]} color={terminalColor(comp.type, k)} />
      ))}
      <Html position={[center[0], BOARD_TOP_Y + 0.05, center[1]]} center zIndexRange={[9, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(29, 78, 216, 0.92)', color: 'white', fontSize: 11, fontWeight: 600,
          padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', fontFamily: 'system-ui, sans-serif',
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

const headerBtn = (active, compact) => ({
  display: 'flex', alignItems: 'center', gap: 8,
  padding: compact ? '8px' : '7px 14px', cursor: 'pointer',
  backgroundColor: active ? '#3b82f6' : '#1a1a1a',
  border: '1px solid #333', borderRadius: 6,
  color: 'white', fontSize: '0.85rem', fontWeight: 500,
});

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
  // Right drawer shows the Circuit Coach or the textbook.
  const [rightTab, setRightTab] = useState('coach');
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
  // Mirror of selectedId for canvas handlers (same staleness reason as above).
  // Selecting a part is what opens its menu.
  const selectedIdRef = useRef(null);
  const selectPart = useCallback((id) => {
    selectedIdRef.current = id;
    setSelectedId(id);
  }, []);
  // "Move" from the part menu: the part rides the cursor until a tap drops
  // it. `origin` lets Esc put it back where it was.
  const [carryId, setCarryId] = useState(null);
  const carryRef = useRef(null);
  const setCarry = useCallback((v) => {
    carryRef.current = v;
    setCarryId(v ? v.id : null);
  }, []);
  // Guided project the coach is following (null = free build).
  const [activeProject, setActiveProject] = useState(null);
  const [showGhost, setShowGhost] = useState(true);
  // Holes / parts the coach is pointing at after "Show me".
  const [highlight, setHighlight] = useState(null);
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

  // Header buttons open a drawer tab, or close it if it's already showing.
  const toggleRight = useCallback((tab, forceOpen = false) => {
    if (!forceOpen && rightOpen && rightTab === tab) {
      setRightOpen(false);
      return;
    }
    setRightTab(tab);
    setRightOpen(true);
  }, [rightOpen, rightTab, setRightOpen]);

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
  // Put a part (and a wire's far end with it) at a hole.
  const moveTo = useCallback((id, x, z) => {
    setPlacedComponents((prev) => prev.map((c) => {
      if (c.id !== id || (c.position[0] === x && c.position[2] === z)) return c;
      const moved = { ...c, position: [x, c.position[1], z] };
      if (c.end) moved.end = [c.end[0] + (x - c.position[0]), c.end[1] + (z - c.position[2])];
      return moved;
    }));
  }, []);

  const handleBoardClick = useCallback((point) => {
    const type = selectedTypeRef.current;
    const brd = boardRef.current || BOARD_TYPES.HALF;
    if (carryRef.current) {
      // A carried part drops into the tapped hole; its menu comes back.
      const [x, z] = snapToGrid(point, brd);
      moveTo(carryRef.current.id, x, z);
      setCarry(null);
      return;
    }
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
    } else {
      selectPart(null);
    }
  }, [setWireStartBoth, selectPart, snapPoint, moveTo, setCarry]);

  const handleBoardHover = useCallback((point) => {
    const type = selectedTypeRef.current;
    const brd = boardRef.current || BOARD_TYPES.HALF;
    if (carryRef.current) {
      // the carried part follows the cursor hole by hole
      const [x, z] = snapToGrid(point, brd);
      moveTo(carryRef.current.id, x, z);
      return;
    }
    if (!type) return;
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
  }, [snapPoint, moveTo]);

  // Pressing a part. A plain click (or tap) opens its menu — or closes it if
  // it was already open. With a mouse, pressing and dragging moves the part
  // directly; on touch a drag stays a camera gesture, so browsing a circuit
  // with your fingers can't rearrange it.
  const pressPart = useCallback((comp, e) => {
    // While placing or wiring, a click on a part is meant for the hole (or
    // terminal) beneath it, so let the event carry on to the board.
    if (selectedTypeRef.current) return;
    e.stopPropagation();
    if (carryRef.current) {
      setCarry(null); // the carried part is under the cursor: drop it here
      return;
    }
    const ctx = canvasCtxRef.current;
    const ne = e.nativeEvent;
    const mouse = ne.pointerType === 'mouse';
    const start = [ne.clientX, ne.clientY];
    const grab = [comp.position[0] - e.point.x, comp.position[2] - e.point.z];
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -comp.position[1]);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();
    let state = 'pending'; // → 'drag' (mouse moved) or 'gesture' (finger moved)
    if (mouse && ctx?.controls) ctx.controls.enabled = false;

    const onMove = (ev) => {
      if (state === 'pending') {
        if (Math.hypot(ev.clientX - start[0], ev.clientY - start[1]) < (mouse ? 5 : 10)) return;
        if (!mouse) { state = 'gesture'; return; }
        state = 'drag';
        dragOffset.current = grab;
        setDragId(comp.id);
        if (selectedIdRef.current !== comp.id) selectPart(null);
        document.body.style.cursor = 'grabbing';
      }
      if (state !== 'drag' || !ctx) return;
      const rect = ctx.gl.domElement.getBoundingClientRect();
      ndc.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, ctx.camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        const [ox, oz] = dragOffset.current;
        const [x, z] = snapToGrid({ x: hit.x + ox, z: hit.z + oz }, boardRef.current || BOARD_TYPES.HALF);
        moveTo(comp.id, x, z);
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (ctx?.controls) ctx.controls.enabled = true;
      document.body.style.cursor = 'auto';
      if (state === 'drag') setDragId(null);
      else if (state === 'pending') selectPart(selectedIdRef.current === comp.id ? null : comp.id);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, [moveTo, selectPart, setCarry]);

  const startCarry = useCallback(() => {
    const comp = placedComponents.find((c) => c.id === selectedIdRef.current);
    if (!comp) return;
    selectType(null);
    setCarry({ id: comp.id, position: comp.position, end: comp.end });
  }, [placedComponents, selectType, setCarry]);

  const cancelCarry = useCallback(() => {
    const c = carryRef.current;
    if (!c) return;
    setPlacedComponents((prev) => prev.map((p) => (p.id === c.id
      ? { ...p, position: c.position, ...(c.end ? { end: c.end } : {}) }
      : p)));
    setCarry(null);
  }, [setCarry]);

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
    if (carryRef.current) cancelCarry();
    selectType((prev) => (prev === type ? null : type));
    selectPart(null);
    setHoverCell(null);
    setWireStartBoth(null);
    rotatePlacement(0);
    if (isMobile) setPaletteOpen(false); // reveal the board for placement
  }, [rotatePlacement, isMobile, setPaletteOpen, selectPart, selectType, setWireStartBoth, cancelCarry]);

  const updateComponent = useCallback((id, patch) => {
    setPlacedComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);


  const stopPlacing = useCallback(() => {
    selectType(null);
    setHoverCell(null);
    setWireStartBoth(null);
  }, [selectType, setWireStartBoth]);

  // Start a guided project. 'guided' clears the board so you build it
  // yourself with the coach checking each step; 'auto' places every part.
  const loadProject = useCallback((project, mode = 'guided') => {
    setPlacedComponents(mode === 'auto' ? projectComponents(project, restY, `p${Date.now()}`) : []);
    setActiveProject(project);
    setBoardType('HALF');
    selectType(null);
    selectPart(null);
    setCarry(null);
    setWireStartBoth(null);
    setHighlight(null);
    setShowProjects(false);
    setRightTab('coach');
    setRightOpen(true);
    if (isMobile) setPaletteOpen(false);
    closeHelp();
  }, [selectPart, selectType, setCarry, setWireStartBoth, closeHelp, setRightOpen, setPaletteOpen, isMobile]);

  // --- Circuit Coach -------------------------------------------------------
  const coach = useMemo(
    () => (activeProject ? checkProject(activeProject, placedComponents, sim) : null),
    [activeProject, placedComponents, sim],
  );
  const freeIssues = useMemo(
    () => (activeProject ? [] : checkCircuit(placedComponents, sim)),
    [activeProject, placedComponents, sim],
  );
  const coachIssues = coach ? coach.issues.filter((i) => i.severity !== 'todo') : freeIssues;
  const problemCount = coachIssues.filter((i) => i.severity === 'error').length;
  const hintFor = (id) => coachIssues.find((i) => i.partIds?.includes(id)) || null;

  // "Show me": select the part involved and pulse the holes for a while.
  const showIssue = useCallback((issue) => {
    const cells = [...(issue.cells || [])];
    for (const id of issue.partIds || []) {
      const c = placedComponents.find((p) => p.id === id);
      if (c && !issue.cells?.length) cells.push(...terminalCells(c));
    }
    setHighlight({ cells, at: Date.now() });
    if (issue.partIds?.length) {
      selectType(null);
      selectPart(issue.partIds[0]);
    }
    if (isMobile) setRightOpen(false); // let them see the board
  }, [placedComponents, selectPart, selectType, isMobile, setRightOpen]);
  useEffect(() => {
    if (!highlight) return undefined;
    const t = setTimeout(() => setHighlight(null), 6000);
    return () => clearTimeout(t);
  }, [highlight]);

  // The guide's version of the part the current step asks you to place.
  const currentStep = coach && coach.current >= 0 ? activeProject.steps[coach.current] : null;
  const ghost = useMemo(() => {
    // only while the part is still missing — not once it's placed but wrong
    if (!currentStep?.place || !activeProject || coach.steps[coach.current].status !== 'todo') return null;
    const idx = activeProject.parts.findIndex((p) => p.ref === currentStep.place);
    const comp = projectComponents(activeProject, restY)[idx];
    const part = activeProject.parts[idx];
    const value = part.type === 'Resistor' ? ` · ${part.value >= 1000 ? `${part.value / 1000} kΩ` : `${part.value} Ω`}`
      : part.type === 'PowerSupply' ? ` · ${part.value} V`
        : part.color ? ` · ${part.color}` : '';
    return { comp, label: `${part.ref}${value}` };
  }, [currentStep, activeProject, coach]);
  // Holes a pending connection step wants joined.
  const connectCells = coach && coach.current >= 0 && currentStep?.connect
    ? coach.steps[coach.current].issue?.cells || []
    : [];

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'Escape' && carryRef.current) {
        cancelCarry();
      } else if (e.key === 'Escape') {
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
      } else if (e.key.startsWith('Arrow') && selectedComponent) {
        // nudge the selected part one hole along the board
        e.preventDefault();
        const [dx, dz] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        const [x, z] = snapToGrid({
          x: selectedComponent.position[0] + dx * PITCH,
          z: selectedComponent.position[2] + dz * PITCH,
        }, board);
        moveTo(selectedComponent.id, x, z);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, selectedComponent, board, moveTo, removeSelected, rotateSelected, rotatePlacement,
    selectPart, selectType, setWireStartBoth, cancelCarry]);

  const renderComponent = (comp) => {
    const Visual = COMPONENT_VISUALS[comp.type];
    if (!Visual) return null;
    return (
      <group
        key={comp.id}
        position={comp.position}
        rotation={[0, comp.rotation || 0, 0]}
        onPointerDown={(e) => pressPart(comp, e)}
        onClick={(e) => { if (!selectedTypeRef.current) e.stopPropagation(); }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (dragId === null) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          if (dragId === null) document.body.style.cursor = 'auto';
        }}
      >
        <Visual
          selected={selectedId === comp.id}
          {...(comp.type === 'LED' ? {
            color: (LED_COLORS[comp.color] || LED_COLORS.red).hex,
            current: sim.readings[comp.id]?.i ?? 0,
          } : {})}
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

  const hint = carryId
    ? 'Moving — tap a hole to drop it · Esc puts it back'
    : selectedType === 'Wire'
      ? (wireStart
        ? 'Now tap the second terminal — the wire routes itself around anything between'
        : 'Tap a red (+) or blue (−) terminal to start the wire')
      : selectedType
        ? `Placing ${selectedType} — tap the board to drop it`
        : selectedId !== null
          ? 'Everything for this part is in its menu · arrow keys nudge · R rotates · Del deletes'
          : 'Click any part to open its menu · drag a part to move it';

  const carried = carryId ? placedComponents.find((c) => c.id === carryId) : null;
  const menuComp = !carryId && !selectedType ? selectedComponent : null;
  const menu = menuComp && (
    <PartMenu
      comp={menuComp}
      reading={sim.readings[menuComp.id]}
      fault={(sim.faults || {})[menuComp.id]}
      hint={hintFor(menuComp.id)}
      onUpdate={updateComponent}
      onRotate={rotateSelected}
      onDelete={removeSelected}
      onMove={startCarry}
      onClose={() => selectPart(null)}
      sheet={isMobile}
    />
  );

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
                color={{ '+': '#ff5555', C: '#ff9944', B: '#ffee55' }[t.polarity] || '#5599ff'}
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
            <meshBasicMaterial color={terminalColor(selectedComponent.type, i)} depthWrite={false} transparent opacity={0.9} />
          </mesh>
        ))}

        {/* The part's menu floats beside it (phones get a bottom sheet instead) */}
        {menu && !isMobile && (
          <Html
            position={[menuComp.position[0], menuComp.position[1] + 0.04, menuComp.position[2]]}
            zIndexRange={[19, 10]}
          >
            <div style={{ transform: 'translate(28px, -50%)' }}>{menu}</div>
          </Html>
        )}

        {/* Guided build: where the next part goes, and holes still to join */}
        {showGhost && ghost && <GhostPart comp={ghost.comp} label={ghost.label} />}
        {connectCells.map((cell, k) => <PulseRing key={`c${k}`} cell={cell} color="#22ff88" />)}
        {highlight && highlight.cells.map((cell, k) => <PulseRing key={`h${highlight.at}-${k}`} cell={cell} />)}

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
              onClick={() => toggleRight('coach')}
              title="Circuit Coach — checks your wiring"
              style={{
                ...headerBtn(rightOpen && rightTab === 'coach', isMobile),
                position: 'relative',
              }}
            >
              <Stethoscope size={16} />
              {!isMobile && 'Coach'}
              {problemCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6, minWidth: 17, height: 17, padding: '0 4px',
                  borderRadius: 9, background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{problemCount}</span>
              )}
            </button>
            <button
              onClick={() => toggleRight('book')}
              title="Lab textbook and build guides"
              style={headerBtn(rightOpen && rightTab === 'book', isMobile)}
            >
              <Book size={16} />
              {!isMobile && 'Textbook'}
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
              onClose={() => setPaletteOpen(false)}
            />
          </div>

          {/* Right drawer — Circuit Coach or textbook */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            zIndex: 20,
            display: 'flex',
            transform: rightOpen ? 'translateX(0)' : 'translateX(110%)',
            transition: 'transform 0.25s ease',
            pointerEvents: rightOpen ? 'auto' : 'none',
          }}>
            <div style={{
              width: rightTab === 'book' ? 'min(480px, 92vw)' : 'min(340px, 92vw)',
              height: '100%', background: 'rgba(15,15,15,0.97)', borderLeft: '1px solid #262626',
              display: 'flex', flexDirection: 'column', color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 8px 0 10px', borderBottom: '1px solid #222' }}>
                {[['coach', 'Coach', <Stethoscope key="i" size={14} />], ['book', 'Textbook', <Book key="i" size={14} />]].map(([id, label, icon]) => (
                  <button
                    key={id}
                    onClick={() => setRightTab(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', cursor: 'pointer',
                      background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600,
                      color: rightTab === id ? 'white' : '#777',
                      borderBottom: `2px solid ${rightTab === id ? '#3b82f6' : 'transparent'}`,
                    }}
                  >
                    {icon} {label}
                    {id === 'coach' && problemCount > 0 && (
                      <span style={{ fontSize: '0.65rem', background: '#ef4444', color: 'white', borderRadius: 8, padding: '1px 6px' }}>{problemCount}</span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setRightOpen(false)}
                  aria-label="Close panel"
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 6, display: 'flex' }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: rightTab === 'coach' ? 14 : 0 }}>
                {rightTab === 'coach' ? (
                  <CoachPanel
                    project={activeProject}
                    result={coach}
                    freeIssues={freeIssues}
                    onShow={showIssue}
                    onExit={() => { setActiveProject(null); setHighlight(null); }}
                    onRestart={() => loadProject(activeProject, 'guided')}
                    onBuildForMe={() => loadProject(activeProject, 'auto')}
                    onOpenProjects={() => setShowProjects(true)}
                    showGhost={showGhost}
                    onToggleGhost={() => setShowGhost((v) => !v)}
                  />
                ) : (
                  <Textbook onStartProject={loadProject} />
                )}
              </div>
            </div>
          </div>

          {/* Floating openers when drawers are closed */}
          {!paletteOpen && (
            <button onClick={() => setPaletteOpen(true)} style={{ ...chipStyle, position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
              <PanelLeftOpen size={16} /> Parts
            </button>
          )}
          {!rightOpen && (
            <button onClick={() => toggleRight('coach')} style={{ ...chipStyle, position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
              <Stethoscope size={16} /> Coach
              {problemCount > 0 && (
                <span style={{ fontSize: '0.65rem', background: '#ef4444', color: 'white', borderRadius: 8, padding: '1px 6px' }}>{problemCount}</span>
              )}
            </button>
          )}

          {/* Bottom centre: guided step, move / placement status */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            zIndex: 15,
            width: 'max-content',
            maxWidth: 'calc(100% - 24px)',
          }}>
            {coach && !(isMobile && menu) && (
              <button
                onClick={() => toggleRight('coach', true)}
                style={{
                  ...chipStyle, borderRadius: 12, maxWidth: '100%', textAlign: 'left',
                  border: `1px solid ${coach.done ? '#1f5a35' : '#2a4a7a'}`,
                  color: coach.done ? '#8ef0ab' : '#dbe7ff',
                }}
              >
                {coach.done ? <CircleCheck size={16} style={{ flexShrink: 0 }} /> : <ArrowRight size={16} style={{ flexShrink: 0, color: '#6aa2ff' }} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {coach.done
                    ? `${activeProject.name} complete!`
                    : `Step ${coach.current + 1}/${activeProject.steps.length}: ${currentStep?.text ?? ''}`}
                </span>
                {problemCount > 0 && !coach.done && (
                  <span style={{ flexShrink: 0, fontSize: '0.65rem', background: '#ef4444', color: 'white', borderRadius: 8, padding: '1px 6px' }}>
                    {problemCount} problem{problemCount > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {carried && (
                <>
                  <span style={{ ...chipStyle, cursor: 'default', color: '#6aa2ff', border: '1px solid #2a4a7a' }}>
                    Moving {carried.ref || carried.type} — tap a hole to drop it
                  </span>
                  <button onClick={cancelCarry} style={chipStyle} aria-label="Cancel move">
                    <X size={16} />
                  </button>
                </>
              )}
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
            </div>
          </div>

          {/* Phones: the part menu is a bottom sheet */}
          {menu && isMobile && (
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 25,
              maxHeight: '62%', overflowY: 'auto', pointerEvents: 'auto',
            }}>
              {menu}
            </div>
          )}
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
            {problemCount > 0 && (
              <button
                onClick={() => toggleRight('coach', true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffaa55', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}
              >
                <Stethoscope size={12} /> {problemCount} to fix
              </button>
            )}
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
                  ? (isMobile ? 'Supply off' : 'Supply output is off — click it and switch it on')
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
