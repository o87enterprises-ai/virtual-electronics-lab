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
};

export const DEFAULT_VALUES = {
  Resistor: 1000,   // ohms
  PowerSupply: 5,   // volts
};

const WIRE_G = 1e3;   // 1 mΩ jumper/closed switch
const OFF_G = 1e-9;   // open switch, capacitor at DC, diode off
const GMIN = 1e-9;    // node-to-ground leak to keep the matrix solvable

const DIODE_PARAMS = {
  Diode: { vf: 0.7, ron: 1 },
  LED: { vf: 1.9, ron: 10 },
};

// World-space grid cells occupied by a component's terminals.
export function terminalCells(comp) {
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
  const supplies = parts.filter((c) => c.type === 'PowerSupply');
  if (supplies.length === 0) return { status: 'no-power', readings: {} };

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
  for (const c of parts) {
    if (c.type === 'Resistor') conductors.push({ comp: c, g: 1 / Math.max(c.value ?? DEFAULT_VALUES.Resistor, 1e-3) });
    else if (c.type === 'Wire') conductors.push({ comp: c, g: WIRE_G });
    else if (c.type === 'Switch') conductors.push({ comp: c, g: c.pressed ? WIRE_G : OFF_G });
    else if (c.type === 'Capacitor') conductors.push({ comp: c, g: OFF_G });
    else if (DIODE_PARAMS[c.type]) diodes.push({ comp: c, ...DIODE_PARAMS[c.type], on: false });
  }

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
    supplies.forEach((s, k) => {
      const [a, c] = nodesOf(s);
      const row = n + k;
      if (a >= 0) { A[a][row] += 1; A[row][a] += 1; }
      if (c >= 0) { A[c][row] -= 1; A[row][c] -= 1; }
      b[row] = s.value ?? DEFAULT_VALUES.PowerSupply;
    });

    x = solveLinear(A, b);
    if (!x) return { status: 'error', readings: {} };

    const volt = (node) => (node >= 0 ? x[node] : 0);
    let changed = false;
    for (const d of diodes) {
      const [a, c] = nodesOf(d.comp);
      const vd = volt(a) - volt(c);
      const on = d.on ? vd >= d.vf - 1e-6 : vd > d.vf;
      if (on !== d.on) { d.on = on; changed = true; }
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
  supplies.forEach((s, k) => {
    const [a, c] = nodesOf(s);
    readings[s.id] = { v: volt(a) - volt(c), i: -x[n + k] };
  });

  return { status: 'ok', readings, nodes: n };
}
