// Circuit Coach — a rule-based checker (no AI). It works out which holes are
// electrically joined, then either follows a guided project's build steps in
// order, or runs general sanity checks on a free-form build, and explains each
// problem with a concrete fix.

import { PITCH } from './constants.js';
import {
  terminalCells, TERMINALS, TERMINAL_NAMES, NON_POLAR, FAULT_MESSAGES,
} from './simulate.js';

const key = ([i, j]) => `${i},${j}`;

// Human names for a part type and each of its terminals.
export const PART_NAMES = {
  Resistor: 'resistor', LED: 'LED', Capacitor: 'capacitor', Diode: 'diode',
  Transistor: 'transistor', IC: 'IC', Switch: 'push button',
  PowerSupply: 'power supply', Antenna: 'antenna', Magnet: 'magnet', Wire: 'jumper wire',
};

const TERMINAL_LABELS = {
  PowerSupply: ['+ post (red)', '− post (black)'],
  LED: ['+ leg (anode)', '− leg (cathode)'],
  Diode: ['anode', 'cathode (striped end)'],
  Capacitor: ['+ leg', '− leg'],
  Transistor: ['collector (C)', 'base (B)', 'emitter (E)'],
  Resistor: ['one leg', 'other leg'],
  Switch: ['one leg', 'other leg'],
  Wire: ['one end', 'other end'],
};

const fmtOhms = (r) => (r >= 1000 ? `${+(r / 1000).toFixed(2)} kΩ` : `${r} Ω`);
const fmtValue = (type, v) => (type === 'Resistor' ? fmtOhms(v) : type === 'PowerSupply' ? `${v} V` : `${v}`);

// Union-find over holes: a part's legs sit in holes, and a jumper joins the
// two holes at its ends. (Only ends connect — a wire passing over a hole
// doesn't touch it.)
export function buildNets(components) {
  const parent = new Map();
  const find = (k) => {
    if (!parent.has(k)) parent.set(k, k);
    let r = k;
    while (parent.get(r) !== r) r = parent.get(r);
    parent.set(k, r);
    return r;
  };
  const union = (a, b) => { parent.set(find(a), find(b)); };
  const holeUse = new Map();   // hole → number of terminals in it
  for (const c of components) {
    const cells = terminalCells(c);
    for (const cell of cells) {
      const k = key(cell);
      find(k);
      holeUse.set(k, (holeUse.get(k) || 0) + 1);
    }
    if (c.type === 'Wire' && cells.length === 2) union(key(cells[0]), key(cells[1]));
  }
  return { netOf: (cell) => find(key(cell)), holeUse };
}

// Turn a project's grid-cell part list into board components (world units).
export function projectComponents(project, restY = () => 0, idPrefix = 'ref') {
  return project.parts.map((p, i) => ({
    id: `${idPrefix}-${project.id}-${i}`,
    ref: p.ref,
    type: p.type,
    position: [p.at[0] * PITCH, restY(p.type), p.at[1] * PITCH],
    rotation: p.rotation || 0,
    ...(p.to ? { end: [p.to[0] * PITCH, p.to[1] * PITCH] } : {}),
    ...(p.value !== undefined ? { value: p.value } : {}),
    ...(p.color !== undefined ? { color: p.color } : {}),
    ...(p.pressed !== undefined ? { pressed: p.pressed } : {}),
    ...(p.type === 'PowerSupply' ? { on: true } : {}),
  }));
}

// "R1.2" → { ref: 'R1', idx: 1 } using the part type's terminal names.
function parsePin(pin, refTypes) {
  const dot = pin.lastIndexOf('.');
  const ref = pin.slice(0, dot);
  const name = pin.slice(dot + 1);
  const idx = (TERMINAL_NAMES[refTypes[ref]] || []).indexOf(name);
  return { ref, idx };
}

// Every order a part's legs could be matched in. Polarised parts may be in
// backwards, so their flipped orders are allowed too, but cost a penalty.
function legOrders(type) {
  const n = (TERMINALS[type] || []).length;
  if (n === 2) return [[0, 1], [1, 0]];
  if (n === 3) return [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  return [[...Array(n).keys()]];
}

const isIdentity = (order) => order.every((v, i) => v === i);

// Find which placed part plays which role in the project, and which way
// round it's been put in, so that as many build steps as possible hold.
function matchParts(project, components, nets) {
  const roles = project.parts.filter((p) => p.ref && p.type !== 'Wire');
  const refTypes = Object.fromEntries(roles.map((p) => [p.ref, p.type]));
  const connects = project.steps
    .filter((s) => s.connect)
    .map((s) => s.connect.map((pin) => parsePin(pin, refTypes)));

  const byType = new Map();
  for (const c of components) {
    if (c.type === 'Wire') continue;
    if (!byType.has(c.type)) byType.set(c.type, []);
    byType.get(c.type).push(c);
  }

  const assign = {};   // ref → { comp, order } | null
  let best = null;
  let budget = 50000;

  const score = () => {
    let s = 0;
    for (const [a, b] of connects) {
      const pa = assign[a.ref];
      const pb = assign[b.ref];
      if (!pa || !pb) continue;
      const ca = terminalCells(pa.comp)[pa.order[a.idx]];
      const cb = terminalCells(pb.comp)[pb.order[b.idx]];
      if (ca && cb && nets.netOf(ca) === nets.netOf(cb)) s += 100;
    }
    for (const r of roles) {
      const m = assign[r.ref];
      if (!m) continue;
      s += 1000; // placing the part at all matters most
      if (r.value !== undefined && m.comp.value === r.value) s += 5;
      if (r.color !== undefined && (m.comp.color || 'red') === r.color) s += 5;
      if (!NON_POLAR.has(r.type) && !isIdentity(m.order)) s -= 1;
    }
    return s;
  };

  const used = new Set();
  const search = (k) => {
    if (budget-- <= 0) return;
    if (k === roles.length) {
      const s = score();
      if (!best || s > best.s) best = { s, assign: { ...assign } };
      return;
    }
    const role = roles[k];
    const candidates = (byType.get(role.type) || []).filter((c) => !used.has(c.id));
    for (const comp of candidates) {
      used.add(comp.id);
      for (const order of legOrders(role.type)) {
        assign[role.ref] = { comp, order };
        search(k + 1);
      }
      used.delete(comp.id);
    }
    // The role may also be unfilled (part not placed yet). Placing scores
    // highest, so this only wins when there's no part left to fill it.
    assign[role.ref] = null;
    search(k + 1);
    delete assign[role.ref];
  };
  search(0);
  return { assign: best ? best.assign : {}, refTypes, roles };
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const partLabel = (role) => {
  const base = PART_NAMES[role.type] || role.type;
  if (role.type === 'Resistor' && role.value) return `${role.ref} (${fmtOhms(role.value)} resistor)`;
  if (role.type === 'LED' && role.color) return `${role.ref} (${role.color} LED)`;
  return `${role.ref} (${base})`;
};

// ---------------------------------------------------------------------------
// Guided-project check: walk the build steps in order.
// Returns { steps: [{ status, issue? }], issues, current, done }.
export function checkProject(project, components, sim) {
  const nets = buildNets(components);
  const { assign, refTypes, roles } = matchParts(project, components, nets);
  const roleOf = Object.fromEntries(roles.map((r) => [r.ref, r]));

  const pinCell = (pin) => {
    const m = assign[pin.ref];
    if (!m) return null;
    return terminalCells(m.comp)[m.order[pin.idx]] || null;
  };
  const pinLabel = (pin) => {
    const role = roleOf[pin.ref];
    // Either leg of a resistor or button will do, so don't name one.
    if (NON_POLAR.has(role.type)) return `a leg of ${role.ref}`;
    const label = (TERMINAL_LABELS[role.type] || [])[pin.idx] || 'leg';
    return `${role.ref}'s ${label}`;
  };

  const issues = [];
  const reportedBackwards = new Set();
  const steps = project.steps.map((step, index) => {
    const n = index + 1;
    if (step.place) {
      const role = roleOf[step.place];
      const m = assign[step.place];
      if (!m) {
        return {
          status: 'todo',
          issue: {
            severity: 'todo', step: n,
            title: `${partLabel(role)} isn't on the board yet`,
            fix: `Open Parts, pick “${PART_NAMES[role.type]}”, and tap the board to place it.`,
            partIds: [], cells: [],
          },
        };
      }
      const problems = [];
      if (role.value !== undefined && m.comp.value !== role.value) {
        problems.push({
          severity: 'error', step: n,
          title: `${role.ref} is ${fmtValue(role.type, m.comp.value)} — this build needs ${fmtValue(role.type, role.value)}`,
          detail: role.type === 'Resistor'
            ? 'The resistor value sets how much current flows. The wrong value can leave an LED dim, or burn it out.'
            : 'The supply voltage sets how hard the circuit is pushed.',
          fix: `Click ${role.ref} and set its value to ${fmtValue(role.type, role.value)} in the menu.`,
          partIds: [m.comp.id], cells: [],
        });
      }
      if (role.color !== undefined && (m.comp.color || 'red') !== role.color) {
        problems.push({
          severity: 'warn', step: n,
          title: `${role.ref} is ${m.comp.color || 'red'} — the guide uses ${role.color}`,
          detail: 'Different colours need slightly different voltages, so readings will differ a little from the guide.',
          fix: `Click ${role.ref} and pick ${role.color} in the menu.`,
          partIds: [m.comp.id], cells: [],
        });
      }
      return problems.length ? { status: 'error', issue: problems[0], extra: problems.slice(1) } : { status: 'done' };
    }

    if (step.connect) {
      const [a, b] = step.connect.map((pin) => parsePin(pin, refTypes));
      const ma = assign[a.ref];
      const mb = assign[b.ref];
      if (!ma || !mb) {
        return { status: 'todo', issue: null };
      }
      const ca = pinCell(a);
      const cb = pinCell(b);
      if (nets.netOf(ca) === nets.netOf(cb)) {
        // Joined — but maybe only because the part is in backwards.
        for (const [pin, m] of [[a, ma], [b, mb]]) {
          const role = roleOf[pin.ref];
          if (!NON_POLAR.has(role.type) && !isIdentity(m.order) && !reportedBackwards.has(pin.ref)) {
            reportedBackwards.add(pin.ref);
            const three = (TERMINALS[role.type] || []).length === 3;
            return {
              status: 'error',
              issue: {
                severity: 'error', step: n,
                title: three
                  ? `${role.ref}'s legs are in the wrong order`
                  : `${role.ref} is in backwards`,
                detail: three
                  ? `A transistor's legs are collector, base, emitter (C-B-E) from left to right. Swapping them stops it switching.`
                  : role.type === 'LED' || role.type === 'Diode'
                    ? `${roleOf[pin.ref].type === 'LED' ? 'An LED' : 'A diode'} only lets current flow one way — from the + leg (anode) to the − leg (cathode). Turned around, it blocks the current.`
                    : 'This part has a + and a − side and must be the right way round.',
                fix: three
                  ? `Click ${role.ref} and rotate it 180°. If it still fails, check the base (middle leg) goes to the base resistor.`
                  : `Click ${role.ref} and press Rotate twice (180°) so its legs swap places.`,
                partIds: [m.comp.id], cells: [],
              },
            };
          }
        }
        return { status: 'done' };
      }
      return {
        status: 'error',
        issue: {
          severity: 'error', step: n,
          title: `${cap(pinLabel(a))} isn't connected to ${pinLabel(b)}`,
          detail: `${step.text} Two legs only connect when they share the exact same hole, or when a jumper wire has one end in each hole.`,
          fix: 'Pick Jumper Wire and tap the two highlighted holes. Or move a part so the two legs share a hole.',
          partIds: [ma.comp.id, mb.comp.id], cells: [ca, cb],
        },
      };
    }

    if (step.expect) {
      const { ref, pressed, on, lit } = step.expect;
      const m = assign[ref];
      if (!m) return { status: 'todo', issue: null };
      if (pressed !== undefined && !!m.comp.pressed !== pressed) {
        return { status: 'todo', issue: null, action: { partIds: [m.comp.id] } };
      }
      if (on !== undefined && (m.comp.on !== false) !== on) {
        return { status: 'todo', issue: null, action: { partIds: [m.comp.id] } };
      }
      if (lit !== undefined) {
        const i = sim?.readings?.[m.comp.id]?.i ?? 0;
        if ((i > 1e-4) !== lit) {
          return { status: 'todo', issue: null, action: { partIds: [m.comp.id] } };
        }
      }
      return { status: 'done' };
    }
    return { status: 'done' };
  });

  for (const s of steps) {
    if (s.issue) issues.push(s.issue);
    if (s.extra) issues.push(...s.extra);
  }

  // Connections that shouldn't exist: two pins meant to be on different
  // nodes of the reference circuit ended up joined on the board.
  const refComps = projectComponents(project);
  const refNets = buildNets(refComps);
  const refCell = Object.fromEntries(refComps
    .filter((c) => c.ref)
    .map((c) => [c.ref, terminalCells(c)]));
  const pins = [];
  for (const role of roles) {
    const count = (TERMINALS[role.type] || []).length;
    for (let idx = 0; idx < count; idx++) {
      const pin = { ref: role.ref, idx };
      const cell = pinCell(pin);
      if (cell) pins.push({ pin, cell, refNet: refNets.netOf(refCell[role.ref][idx]) });
    }
  }
  const pairs = [];
  for (let x = 0; x < pins.length; x++) {
    for (let y = x + 1; y < pins.length; y++) {
      const p = pins[x];
      const q = pins[y];
      if (p.refNet === q.refNet) continue;
      if (nets.netOf(p.cell) !== nets.netOf(q.cell)) continue;
      pairs.push([p, q]);
    }
  }
  // A part with its own legs joined is the clearest way to describe a short,
  // so report those before pairs that span two parts.
  pairs.sort((u, v) => (v[0].pin.ref === v[1].pin.ref) - (u[0].pin.ref === u[1].pin.ref));
  const seen = new Set();
  for (const [p, q] of pairs) {
    const pair = [p.refNet, q.refNet].sort().join('|');
    if (seen.has(pair)) continue;
    seen.add(pair);
    const samePart = p.pin.ref === q.pin.ref;
    issues.push({
      severity: 'error',
      step: null,
      title: samePart
        ? `${roleOf[p.pin.ref].ref}'s legs are connected to each other`
        : `${cap(pinLabel(p.pin))} is joined to ${pinLabel(q.pin)}, but shouldn't be`,
      detail: samePart
        ? 'With both legs joined, current skips straight past the part (a short across it), so it does nothing.'
        : 'This extra connection lets current take a shortcut the circuit wasn\'t designed for.',
      fix: 'Look for a jumper wire joining these two, or two legs sharing one hole, and move or delete it.',
      partIds: [...new Set([assign[p.pin.ref].comp.id, assign[q.pin.ref].comp.id])],
      cells: [p.cell, q.cell],
    });
  }

  // Parts on the board that the build doesn't use.
  const usedIds = new Set(Object.values(assign).filter(Boolean).map((m) => m.comp.id));
  for (const c of components) {
    if (c.type === 'Wire' || usedIds.has(c.id)) continue;
    issues.push({
      severity: 'warn', step: null,
      title: `An extra ${PART_NAMES[c.type] || c.type} isn't part of this build`,
      detail: 'It\'s harmless if nothing touches it, but it can create extra paths if its legs share holes with the circuit.',
      fix: 'Click it and choose Delete, unless you\'re experimenting on purpose.',
      partIds: [c.id], cells: [],
    });
  }

  // Wired right but switched off is the classic "why won't it light?".
  for (const role of roles) {
    const m = assign[role.ref];
    if (role.type === 'PowerSupply' && m && m.comp.on === false) {
      issues.push({
        severity: 'error', step: null,
        title: `${role.ref} (the power supply) is switched off`,
        detail: 'With the output off, no current can flow anywhere, however well the circuit is wired.',
        fix: `Click ${role.ref} and tap Output to switch it on.`,
        partIds: [m.comp.id], cells: [],
      });
    }
  }

  issues.push(...faultIssues(components, sim));

  const current = steps.findIndex((s) => s.status !== 'done');
  return { steps, issues, current, done: current === -1 && !issues.some((i) => i.severity === 'error') };
}

// ---------------------------------------------------------------------------
// Explanations for simulator faults, shared by both modes.
function faultIssues(components, sim) {
  const out = [];
  for (const [id, kind] of Object.entries(sim?.faults || {})) {
    const c = components.find((p) => p.id === id);
    if (!c) continue;
    const name = PART_NAMES[c.type] || c.type;
    const text = {
      short: {
        title: 'Short circuit — the supply\'s + and − are joined with (almost) nothing in between',
        detail: 'Current always takes the easiest path. A wire straight from + to − (or through a pressed button with no load) lets the supply dump all its current.',
        fix: 'Find the path from the + post back to the − post that has no resistor or LED in it, and break it.',
      },
      overcurrent: c.type === 'Transistor' ? {
        title: 'The transistor is carrying too much collector current',
        detail: 'Its collector needs a load (like an LED plus resistor) to limit the current.',
        fix: 'Put a resistor in series with whatever the collector drives.',
      } : {
        title: `The ${name} is burning out — too much current`,
        detail: `An ${name} can only take about ${c.type === 'LED' ? '30 mA' : '1 A'}. Without a resistor in series, nothing limits the current.`,
        fix: 'Add a resistor (220 Ω – 1 kΩ) in series with it, or raise the resistor you have.',
      },
      overpower: {
        title: 'A resistor is overheating (over ½ W)',
        detail: 'Power = V × I. A small resistor straight across the supply turns a lot of power into heat.',
        fix: 'Use a larger resistance, or lower the supply voltage.',
      },
      'reverse-polarity': {
        title: 'The capacitor is in backwards',
        detail: 'Electrolytic capacitors have a + and − leg, and fail if reversed.',
        fix: 'Rotate it 180° so its + leg faces the positive side.',
      },
      'base-overcurrent': {
        title: 'The transistor\'s base has no resistor',
        detail: 'The base–emitter junction behaves like a diode: fed straight from the supply it draws far too much current.',
        fix: 'Put a resistor (about 1 kΩ) between the base and whatever drives it.',
      },
    }[kind] || { title: FAULT_MESSAGES[kind] || kind, detail: '', fix: '' };
    out.push({ severity: 'error', step: null, ...text, partIds: [id], cells: [] });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Free-build check: general rules, ordered from "can't work at all" to hints.
export function checkCircuit(components, sim) {
  const issues = [];
  if (components.length === 0) {
    return [{
      severity: 'info', title: 'The board is empty',
      detail: 'Every circuit starts with a power source.',
      fix: 'Open Parts and place a DC Power Supply, or open Projects for a guided build.',
      partIds: [], cells: [],
    }];
  }
  const supplies = components.filter((c) => c.type === 'PowerSupply');
  if (supplies.length === 0) {
    issues.push({
      severity: 'error', title: 'There\'s no power supply',
      detail: 'Nothing moves without a source of voltage — it\'s the “pump” that pushes current around the loop.',
      fix: 'Open Parts and place a DC Power Supply.',
      partIds: [], cells: [],
    });
  } else if (supplies.every((s) => s.on === false)) {
    issues.push({
      severity: 'error', title: 'The power supply is switched off',
      fix: 'Click the power supply and press Turn On.',
      partIds: supplies.map((s) => s.id), cells: [],
    });
  }

  issues.push(...faultIssues(components, sim));

  // Loose legs: a terminal alone in its hole connects to nothing.
  const nets = buildNets(components);
  for (const c of components) {
    if (!TERMINALS[c.type] && !c.end) continue;
    const cells = terminalCells(c);
    cells.forEach((cell, idx) => {
      if ((nets.holeUse.get(key(cell)) || 0) > 1) return;
      const label = (TERMINAL_LABELS[c.type] || [])[idx] || 'leg';
      const name = PART_NAMES[c.type] || c.type;
      issues.push({
        severity: 'error',
        title: c.type === 'Wire'
          ? 'A jumper wire has an end that isn\'t touching anything'
          : `The ${name}'s ${label} isn't connected to anything`,
        detail: c.type === 'Wire'
          ? 'A wire only connects at its two ends, and each end must sit in the exact same hole as a part\'s leg (look for the green ring).'
          : 'Current needs a complete loop. A leg in a hole on its own is a dead end, so nothing flows through this part.',
        fix: c.type === 'Wire'
          ? 'Delete the wire and redraw it — tap a coloured terminal dot for each end so it snaps on.'
          : `Run a jumper from this ${label} to the next part in the loop.`,
        partIds: [c.id], cells: [cell],
      });
    });
  }

  // A part whose own legs are joined is bypassed (shorted out).
  for (const c of components) {
    if (c.type === 'Wire' || c.type === 'PowerSupply' || !TERMINALS[c.type]) continue;
    const cells = terminalCells(c);
    if (cells.length < 2) continue;
    const joined = cells.some((a, x) => cells.some((b, y) => y > x && nets.netOf(a) === nets.netOf(b)));
    if (!joined) continue;
    const name = PART_NAMES[c.type] || c.type;
    issues.push({
      severity: 'error',
      title: `The ${name}'s legs are connected to each other`,
      detail: 'With both legs joined, current skips straight past the part (it\'s “shorted out”), so it does nothing.',
      fix: 'Look for a jumper wire running from one of its legs to the other, and delete or move it.',
      partIds: [c.id], cells,
    });
  }

  if (sim?.status === 'ok') {
    for (const c of components) {
      const r = sim.readings[c.id];
      if (!r) continue;
      if ((c.type === 'LED' || c.type === 'Diode') && r.v < -0.5) {
        issues.push({
          severity: 'error',
          title: `The ${PART_NAMES[c.type]} is in backwards`,
          detail: 'It has voltage across it the wrong way round, so it blocks the current. Current must enter the + leg (anode, red dot) and leave the − leg (cathode, blue dot).',
          fix: 'Click it and press Rotate twice (180°).',
          partIds: [c.id], cells: [],
        });
      }
      if (c.type === 'Switch' && !c.pressed && Math.abs(r.v) > 0.5) {
        issues.push({
          severity: 'info',
          title: 'A push button is open, so its loop is broken',
          detail: 'An open button acts like a gap in the wire. You can see the voltage waiting across it.',
          fix: 'Click the button and press it to close the loop.',
          partIds: [c.id], cells: [],
        });
      }
      if (c.type === 'LED' && r.i > 0.02 && !sim.faults?.[c.id]) {
        issues.push({
          severity: 'warn',
          title: 'An LED is running hot (over 20 mA)',
          detail: 'It works, but it\'s close to its 30 mA limit and would have a short life.',
          fix: 'Raise its series resistor, e.g. to 330 Ω for a 5 V supply.',
          partIds: [c.id], cells: [],
        });
      }
    }
  }

  // Everything connected, yet nothing flows: the loop is open somewhere.
  if (sim?.status === 'ok' && !issues.some((i) => i.severity === 'error')) {
    const flowing = supplies.some((sp) => Math.abs(sim.readings[sp.id]?.i ?? 0) > 1e-5);
    const loads = components.filter((c) => !['Wire', 'PowerSupply'].includes(c.type) && TERMINALS[c.type]);
    if (!flowing && loads.length && !issues.some((i) => i.title.startsWith('A push button'))) {
      issues.push({
        severity: 'error',
        title: 'No current is flowing — the loop isn\'t closed',
        detail: 'Current has to leave the red + post, pass through your parts, and come back to the black − post. Somewhere that path is broken or blocked.',
        fix: 'Trace the path with your finger from + to −. Check that each connection shares a hole or has a wire, and that LEDs and diodes point from + towards −.',
        partIds: supplies.map((sp) => sp.id), cells: [],
      });
    }
  }

  const unsimulated = components.filter((c) => ['IC', 'Antenna', 'Magnet'].includes(c.type));
  if (unsimulated.length) {
    issues.push({
      severity: 'info',
      title: 'Some parts are decorative for now',
      detail: `${[...new Set(unsimulated.map((c) => PART_NAMES[c.type]))].join(', ')} ${unsimulated.length > 1 ? 'aren\'t' : 'isn\'t'} simulated yet, so ${unsimulated.length > 1 ? 'they don\'t' : 'it doesn\'t'} affect the circuit.`,
      partIds: unsimulated.map((c) => c.id), cells: [],
    });
  }
  return issues;
}

// Board-space helper for highlighting cells.
export const cellToWorld = ([i, j]) => [i * PITCH, j * PITCH];
