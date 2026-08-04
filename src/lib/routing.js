import { PITCH } from './constants.js';
import { terminalCells, TERMINALS } from './simulate.js';

// Half-extents of each part's body in grid cells, before rotation. Used so
// jumper wires route around components instead of through them.
const FOOTPRINT = {
  Resistor: [3, 0], Diode: [2, 0], LED: [1, 1], Capacitor: [1, 1],
  Transistor: [1, 1], IC: [2, 2], Switch: [1, 1], PowerSupply: [3, 3],
  Antenna: [0, 0], Magnet: [2, 1],
};

export const cellKey = (i, j) => `${i},${j}`;

export function footprintCells(comp) {
  const f = FOOTPRINT[comp.type];
  if (!f) return [];
  const quarter = ((Math.round((comp.rotation || 0) / (Math.PI / 2)) % 2) + 2) % 2;
  const hx = quarter === 1 ? f[1] : f[0];
  const hz = quarter === 1 ? f[0] : f[1];
  const ci = Math.round(comp.position[0] / PITCH);
  const cj = Math.round(comp.position[2] / PITCH);
  const cells = [];
  for (let i = -hx; i <= hx; i++) for (let j = -hz; j <= hz; j++) cells.push([ci + i, cj + j]);
  return cells;
}

// Everything a wire should avoid crossing. Terminals stay blocked too: a wire
// merely passing over someone else's solder point would look connected without
// being connected, which is exactly the confusion we're removing.
export function blockedCells(components) {
  const blocked = new Set();
  for (const c of components) {
    if (c.type === 'Wire') continue;
    for (const [i, j] of footprintCells(c)) blocked.add(cellKey(i, j));
  }
  return blocked;
}

// Every solderable point on the board, for magnetic snapping. index 0 of a
// part's terminals is its + / anode side, index 1 the − / cathode side.
export function terminalTargets(components) {
  const targets = [];
  for (const c of components) {
    if (!TERMINALS[c.type] && !c.end) continue;
    const cells = terminalCells(c);
    cells.forEach(([i, j], idx) => {
      targets.push({
        compId: c.id,
        type: c.type,
        cell: [i, j],
        world: [i * PITCH, j * PITCH],
        polarity: cells.length === 2 ? (idx === 0 ? '+' : '−') : '',
      });
    });
  }
  return targets;
}

// Cells where two or more terminals meet — i.e. a real electrical junction.
export function junctionCells(components) {
  const counts = new Map();
  for (const t of terminalTargets(components)) {
    const k = cellKey(t.cell[0], t.cell[1]);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .map(([k]) => k.split(',').map(Number));
}

const same = (p, q) => p[0] === q[0] && p[1] === q[1];

function simplify(points) {
  const out = [];
  for (const p of points) {
    if (out.length && same(out[out.length - 1], p)) continue;
    // drop the middle of three collinear points
    if (out.length >= 2) {
      const a = out[out.length - 2];
      const b = out[out.length - 1];
      const collinear = (a[0] === b[0] && b[0] === p[0]) || (a[1] === b[1] && b[1] === p[1]);
      if (collinear) out.pop();
    }
    out.push(p);
  }
  return out;
}

function cellsAlong(points) {
  const cells = [];
  for (let k = 0; k < points.length - 1; k++) {
    const [x1, z1] = points[k];
    const [x2, z2] = points[k + 1];
    // every generated segment is axis-aligned; bail rather than loop forever
    if (x1 !== x2 && z1 !== z2) return cells;
    const sx = Math.sign(x2 - x1);
    const sz = Math.sign(z2 - z1);
    let x = x1, z = z1;
    cells.push([x, z]);
    while (x !== x2 || z !== z2) {
      x += sx; z += sz;
      cells.push([x, z]);
    }
  }
  return cells;
}

function pathLength(points) {
  let len = 0;
  for (let k = 0; k < points.length - 1; k++) {
    len += Math.abs(points[k + 1][0] - points[k][0]) + Math.abs(points[k + 1][1] - points[k][1]);
  }
  return len;
}

// Route a jumper between two holes along the grid, bending around component
// bodies. Prefers no collisions, then fewest bends, then shortest run.
export function routeCells(a, b, blocked = new Set()) {
  if (same(a, b)) return [a];
  const candidates = [
    [a, [b[0], a[1]], b],
    [a, [a[0], b[1]], b],
  ];
  if (a[0] !== b[0]) {
    const step = a[0] < b[0] ? 1 : -1;
    for (let x = a[0] + step; x !== b[0]; x += step) candidates.push([a, [x, a[1]], [x, b[1]], b]);
  }
  if (a[1] !== b[1]) {
    const step = a[1] < b[1] ? 1 : -1;
    for (let z = a[1] + step; z !== b[1]; z += step) candidates.push([a, [a[0], z], [b[0], z], b]);
  }
  // Sidesteps for holes that line up with something sitting between them —
  // the L and Z candidates above degenerate to a straight line in that case.
  for (let d = 1; d <= 6; d++) {
    for (const s of [d, -d]) {
      if (a[1] === b[1]) candidates.push([a, [a[0], a[1] + s], [b[0], b[1] + s], b]);
      if (a[0] === b[0]) candidates.push([a, [a[0] + s, a[1]], [b[0] + s, b[1]], b]);
    }
  }

  let best = null;
  for (const raw of candidates) {
    const pts = simplify(raw);
    let hits = 0;
    for (const [i, j] of cellsAlong(pts)) {
      if (same([i, j], a) || same([i, j], b)) continue;
      if (blocked.has(cellKey(i, j))) hits++;
    }
    const score = [hits, pts.length - 2, pathLength(pts)];
    if (!best || score[0] < best.score[0]
      || (score[0] === best.score[0] && score[1] < best.score[1])
      || (score[0] === best.score[0] && score[1] === best.score[1] && score[2] < best.score[2])) {
      best = { pts, score };
    }
  }
  return best.pts;
}

// World-space path (relative to the wire's start) for rendering.
export function wireRenderPath(comp, components) {
  const a = [Math.round(comp.position[0] / PITCH), Math.round(comp.position[2] / PITCH)];
  const b = comp.end
    ? [Math.round(comp.end[0] / PITCH), Math.round(comp.end[1] / PITCH)]
    : [a[0] + 6, a[1]];
  const blocked = blockedCells(components || []);
  return routeCells(a, b, blocked).map(([i, j]) => [
    i * PITCH - comp.position[0],
    j * PITCH - comp.position[2],
  ]);
}
