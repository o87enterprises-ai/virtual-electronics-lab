import { PITCH } from './constants.js';

// Electrical terminals per component type, as [x, z] offsets in grid cells
// from the component origin (before rotation). Two-terminal parts list
// [first, second]; for polarized parts the first entry is the positive
// terminal (anode / + post).
export const TERMINALS = {
  Resistor: [[-3, 0], [3, 0]],
  Wire: [[-3, 0], [3, 0]],
  Diode: [[-2, 0], [2, 0]],       // [anode, cathode] — band on the +x side
  LED: [[-1, 0], [1, 0]],         // [anode, cathode]
  Capacitor: [[-1, 0], [1, 0]],
  Switch: [[-1, 0], [1, 0]],
  PowerSupply: [[-2, 3], [2, 3]], // [+ red post, − black post]
  Transistor: [[-1, 0], [0, 0], [1, 0]], // [collector, base, emitter]
};

// Short names for each terminal, in TERMINALS order. Used by project
// definitions ("D1.K") and by the circuit coach's messages.
export const TERMINAL_NAMES = {
  Resistor: ['1', '2'],
  Wire: ['1', '2'],
  Switch: ['1', '2'],
  Diode: ['A', 'K'],
  LED: ['A', 'K'],
  Capacitor: ['+', '-'],
  PowerSupply: ['+', '-'],
  Transistor: ['C', 'B', 'E'],
};

// Parts whose legs are interchangeable — flipping one changes nothing.
export const NON_POLAR = new Set(['Resistor', 'Wire', 'Switch']);

// LED colours and their typical forward voltages.
export const LED_COLORS = {
  red: { vf: 1.9, hex: '#ff3333', label: 'Red' },
  yellow: { vf: 2.0, hex: '#ffcc22', label: 'Yellow' },
  green: { vf: 2.1, hex: '#33ff66', label: 'Green' },
  blue: { vf: 3.0, hex: '#3399ff', label: 'Blue' },
};

export const DEFAULT_VALUES = {
  Resistor: 1000,   // ohms
  PowerSupply: 5,   // volts
};

// Absolute maximum ratings; exceeding one flags a fault (smoke/sparks in the
// scene, warning in the multimeter).
export const RATINGS = {
  LED: { maxCurrent: 0.03 },        // 30 mA
  Diode: { maxCurrent: 1 },         // 1N4001: 1 A
  Resistor: { maxPower: 0.5 },      // ½ W
  PowerSupply: { maxCurrent: 2 },   // bench supply current limit
  Capacitor: { maxReverse: 1 },     // electrolytic: ~1 V reverse max
  Transistor: { maxCurrent: 0.2, maxBase: 0.05 }, // 2N3904-class NPN
};

export const FAULT_MESSAGES = {
  overcurrent: 'Overcurrent — exceeds the part\'s maximum forward current',
  overpower: 'Over power rating (>½ W) — use a bigger resistor or lower voltage',
  short: 'Short circuit — supply current limit exceeded',
  'reverse-polarity': 'Electrolytic capacitor reversed — check + / − orientation',
  'base-overcurrent': 'Base current too high — the base needs a resistor (about 1 kΩ)',
};

const WIRE_G = 1e3;   // 1 mΩ jumper/closed switch
const OFF_G = 1e-9;   // open switch, capacitor at DC, diode off
const GMIN = 1e-9;    // node-to-ground leak to keep the matrix solvable

const DIODE_PARAMS = {
  Diode: { vf: 0.7, ron: 1 },
  LED: { vf: 1.9, ron: 10 },
};

// NPN model: base–emitter behaves like a diode; the collector then carries
// β × base current until the transistor saturates at V_CE ≈ 0.2 V.
const NPN = { beta: 100, vbe: 0.7, rbe: 20, vceSat: 0.2, rsat: 1 };

const diodeParams = (c) => (c.type === 'LED'
  ? { ...DIODE_PARAMS.LED, vf: (LED_COLORS[c.color] || LED_COLORS.red).vf }
  : DIODE_PARAMS[c.type]);

const cellOf = (x, z) => [Math.round(x / PITCH), Math.round(z / PITCH)];

// World-space grid cells occupied by a component's terminals.
export function terminalCells(comp) {
  // Variable-length jumpers store their far end explicitly.
  if (comp.type === 'Wire' && comp.end) {
    return [cellOf(comp.position[0], comp.position[2]), cellOf(comp.end[0], comp.end[1])];
  }
  const t = TERMINALS[comp.type];
  if (!t) return [];
  const k = ((Math.round((comp.rotation || 0) / (Math.PI / 2)) % 4) + 4) % 4;
  const cos = [1, 0, -1, 0][k];
  const sin = [0, 1, 0, -1][k];
  const ci = Math.round(comp.position[0] / PITCH);
  const cj = Math.round(comp.position[2] / PITCH);
  return t.map(([x, z]) => [ci + x * cos + z * sin, cj - x * sin + z * cos]);
}

export function terminalWorldPositions(comp, y) {
  return terminalCells(comp).map(([i, j]) => [i * PITCH, y, j * PITCH]);
}

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-15) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / M[i][i]);
}

// DC operating point of the placed components via modified nodal analysis.
// Returns { status, readings } where readings maps component id to
// { v (volts across, first terminal minus second), i (amps through) }.
export function runSimulation(components) {
  const parts = components.filter((c) => TERMINALS[c.type]);
  const allSupplies = parts.filter((c) => c.type === 'PowerSupply');
  // A supply switched off is an open output: it still defines the ground
  // reference, but sources nothing.
  const supplies = allSupplies.filter((c) => c.on !== false);
  if (allSupplies.length === 0) return { status: 'no-power', readings: {}, faults: {} };
  if (supplies.length === 0) return { status: 'powered-off', readings: {}, faults: {} };

  // Map every referenced hole to a node; the first supply's − post is ground.
  const cellKeysOf = new Map();
  for (const c of parts) cellKeysOf.set(c.id, terminalCells(c).map(([i, j]) => `${i},${j}`));
  const groundKey = cellKeysOf.get(supplies[0].id)[1];
  const nodeIndex = new Map([[groundKey, -1]]);
  for (const keys of cellKeysOf.values())
    for (const key of keys)
      if (!nodeIndex.has(key)) nodeIndex.set(key, nodeIndex.size - 1);
  const n = nodeIndex.size - 1;
  const m = supplies.length;

  const conductors = [];   // { comp, g }
  const diodes = [];       // { comp, vf, ron, on }
  const transistors = [];  // { comp, mode: 'off' | 'active' | 'sat' }
  for (const c of parts) {
    if (c.type === 'Resistor') conductors.push({ comp: c, g: 1 / Math.max(c.value ?? DEFAULT_VALUES.Resistor, 1e-3) });
    else if (c.type === 'Wire') conductors.push({ comp: c, g: WIRE_G });
    else if (c.type === 'Switch') conductors.push({ comp: c, g: c.pressed ? WIRE_G : OFF_G });
    else if (c.type === 'Capacitor') conductors.push({ comp: c, g: OFF_G });
    else if (DIODE_PARAMS[c.type]) diodes.push({ comp: c, ...diodeParams(c), on: false });
    else if (c.type === 'Transistor') transistors.push({ comp: c, mode: 'off' });
  }
  // switched-off supplies contribute nothing but still need readings
  const idleSupplies = allSupplies.filter((c) => c.on === false);

  const nodesOf = (c) => cellKeysOf.get(c.id).map((k) => nodeIndex.get(k));
  const size = n + m;
  let x = null;

  for (let iter = 0; iter < 40; iter++) {
    const A = Array.from({ length: size }, () => new Array(size).fill(0));
    const b = new Array(size).fill(0);
    for (let i = 0; i < n; i++) A[i][i] += GMIN;

    const stampG = (a, c, g) => {
      if (a >= 0) A[a][a] += g;
      if (c >= 0) A[c][c] += g;
      if (a >= 0 && c >= 0) { A[a][c] -= g; A[c][a] -= g; }
    };

    for (const el of conductors) {
      const [a, c] = nodesOf(el.comp);
      stampG(a, c, el.g);
    }
    for (const d of diodes) {
      const [a, c] = nodesOf(d.comp);
      const g = d.on ? 1 / d.ron : OFF_G;
      stampG(a, c, g);
      if (d.on) {
        if (a >= 0) b[a] += g * d.vf;
        if (c >= 0) b[c] -= g * d.vf;
      }
    }
    for (const q of transistors) {
      const [nc, nb, ne] = nodesOf(q.comp);
      if (q.mode === 'off') {
        stampG(nb, ne, OFF_G);
        stampG(nc, ne, OFF_G);
        continue;
      }
      // base–emitter junction conducting
      const gbe = 1 / NPN.rbe;
      stampG(nb, ne, gbe);
      if (nb >= 0) b[nb] += gbe * NPN.vbe;
      if (ne >= 0) b[ne] -= gbe * NPN.vbe;
      if (q.mode === 'active') {
        // collector current source: I_C = β·g_be·(V_B − V_E − V_BE)
        const gm = NPN.beta * gbe;
        if (nc >= 0) {
          if (nb >= 0) A[nc][nb] += gm;
          if (ne >= 0) A[nc][ne] -= gm;
          b[nc] += gm * NPN.vbe;
        }
        if (ne >= 0) {
          if (nb >= 0) A[ne][nb] -= gm;
          A[ne][ne] += gm;
          b[ne] -= gm * NPN.vbe;
        }
      } else {
        const gs = 1 / NPN.rsat;
        stampG(nc, ne, gs);
        if (nc >= 0) b[nc] += gs * NPN.vceSat;
        if (ne >= 0) b[ne] -= gs * NPN.vceSat;
      }
    }
    supplies.forEach((s, k) => {
      const [a, c] = nodesOf(s);
      const row = n + k;
      if (a >= 0) { A[a][row] += 1; A[row][a] += 1; }
      if (c >= 0) { A[c][row] -= 1; A[row][c] -= 1; }
      b[row] = s.value ?? DEFAULT_VALUES.PowerSupply;
    });

    x = solveLinear(A, b);
    if (!x) return { status: 'error', readings: {}, faults: {} };

    const volt = (node) => (node >= 0 ? x[node] : 0);
    let changed = false;
    for (const d of diodes) {
      const [a, c] = nodesOf(d.comp);
      const vd = volt(a) - volt(c);
      const on = d.on ? vd >= d.vf - 1e-6 : vd > d.vf;
      if (on !== d.on) { d.on = on; changed = true; }
    }
    for (const q of transistors) {
      const [nc, nb, ne] = nodesOf(q.comp);
      const vbe = volt(nb) - volt(ne);
      const vce = volt(nc) - volt(ne);
      const ib = (vbe - NPN.vbe) / NPN.rbe;
      let mode = q.mode;
      if (q.mode === 'off') {
        if (vbe > NPN.vbe) mode = 'active';
      } else if (vbe < NPN.vbe - 1e-6) {
        mode = 'off';
      } else if (q.mode === 'active' && vce < NPN.vceSat) {
        mode = 'sat';
      } else if (q.mode === 'sat' && (vce - NPN.vceSat) / NPN.rsat > NPN.beta * ib) {
        mode = 'active';
      }
      if (mode !== q.mode) { q.mode = mode; changed = true; }
    }
    if (!changed) break;
  }

  const volt = (node) => (node >= 0 ? x[node] : 0);
  const readings = {};
  for (const el of conductors) {
    const [a, c] = nodesOf(el.comp);
    const v = volt(a) - volt(c);
    readings[el.comp.id] = { v, i: v * el.g };
  }
  for (const d of diodes) {
    const [a, c] = nodesOf(d.comp);
    const v = volt(a) - volt(c);
    readings[d.comp.id] = { v, i: d.on ? (v - d.vf) / d.ron : 0 };
  }
  for (const q of transistors) {
    const [nc, nb, ne] = nodesOf(q.comp);
    const vbe = volt(nb) - volt(ne);
    const vce = volt(nc) - volt(ne);
    const ib = q.mode === 'off' ? 0 : (vbe - NPN.vbe) / NPN.rbe;
    const ic = q.mode === 'off' ? 0
      : q.mode === 'active' ? NPN.beta * ib : (vce - NPN.vceSat) / NPN.rsat;
    // v/i report the collector–emitter path, the part's "main" current
    readings[q.comp.id] = { v: vce, i: ic, ib, vbe, mode: q.mode };
  }
  supplies.forEach((s, k) => {
    const [a, c] = nodesOf(s);
    readings[s.id] = { v: volt(a) - volt(c), i: -x[n + k] };
  });
  for (const s of idleSupplies) {
    const [a, c] = nodesOf(s);
    readings[s.id] = { v: volt(a) - volt(c), i: 0 };
  }

  const faults = {};
  for (const c of parts) {
    const r = readings[c.id];
    if (!r) continue;
    const rating = RATINGS[c.type];
    if (!rating) continue;
    if (c.type === 'Resistor' && Math.abs(r.v * r.i) > rating.maxPower) faults[c.id] = 'overpower';
    else if (c.type === 'PowerSupply' && Math.abs(r.i) > rating.maxCurrent) faults[c.id] = 'short';
    else if (c.type === 'Capacitor' && r.v < -rating.maxReverse) faults[c.id] = 'reverse-polarity';
    else if ((c.type === 'LED' || c.type === 'Diode') && Math.abs(r.i) > rating.maxCurrent) faults[c.id] = 'overcurrent';
    else if (c.type === 'Transistor' && r.ib > rating.maxBase) faults[c.id] = 'base-overcurrent';
    else if (c.type === 'Transistor' && Math.abs(r.i) > rating.maxCurrent) faults[c.id] = 'overcurrent';
  }

  return { status: 'ok', readings, faults, nodes: n };
}
