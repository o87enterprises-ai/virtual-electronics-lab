// Schematic symbols and breadboard layout diagrams for the guided projects.
// Layouts are drawn from the same project data (and the same wire router) the
// 3D board uses, so a printed layout always matches "Build it for me".

import { projectComponents } from '../lib/coach';
import { terminalCells, LED_COLORS } from '../lib/simulate';
import { blockedCells, routeCells } from '../lib/routing';
import { PITCH } from '../lib/constants';

// ---------------------------------------------------------------------------
// Schematic symbols

const wire = { stroke: '#7db87d', strokeWidth: 2, fill: 'none' };
const sym = { stroke: '#ddd', strokeWidth: 2, fill: 'none' };

function Battery({ x, y }) {
  return (
    <g>
      <line x1={x - 10} y1={y} x2={x + 10} y2={y} {...sym} strokeWidth={3} />
      <line x1={x - 5} y1={y + 8} x2={x + 5} y2={y + 8} {...sym} />
      <text x={x + 14} y={y + 2} fill="#dd4444" fontSize="10">+</text>
      <text x={x + 14} y={y + 13} fill="#999" fontSize="12">−</text>
    </g>
  );
}
function ResistorSym({ x, y, label }) {
  return (
    <g>
      <path d={`M ${x - 18} ${y} l 4 -6 l 6 12 l 6 -12 l 6 12 l 6 -12 l 4 6`} {...sym} />
      <text x={x} y={y - 10} fill="#999" fontSize="9" textAnchor="middle">{label}</text>
    </g>
  );
}
function LedSym({ x, y, color = '#cc3333' }) {
  return (
    <g>
      <polygon points={`${x - 6},${y - 7} ${x - 6},${y + 7} ${x + 6},${y}`} fill={color} stroke={color} />
      <line x1={x + 6} y1={y - 7} x2={x + 6} y2={y + 7} {...sym} />
      <line x1={x + 2} y1={y - 9} x2={x + 7} y2={y - 15} stroke="#cc7733" strokeWidth={1.5} />
      <line x1={x + 7} y1={y - 15} x2={x + 4} y2={y - 14} stroke="#cc7733" strokeWidth={1.5} />
    </g>
  );
}
function DiodeSym({ x, y, label }) {
  return (
    <g>
      <polygon points={`${x - 6},${y - 7} ${x - 6},${y + 7} ${x + 6},${y}`} fill="none" stroke="#ddd" strokeWidth={2} />
      <line x1={x + 6} y1={y - 7} x2={x + 6} y2={y + 7} {...sym} />
      {label && <text x={x} y={y - 11} fill="#999" fontSize="9" textAnchor="middle">{label}</text>}
    </g>
  );
}
function SwitchSym({ x, y, label }) {
  return (
    <g>
      <circle cx={x - 8} cy={y} r={2} fill="#ddd" />
      <circle cx={x + 8} cy={y} r={2} fill="#ddd" />
      <line x1={x - 8} y1={y} x2={x + 8} y2={y - 9} {...sym} />
      {label && <text x={x} y={y + 12} fill="#999" fontSize="9" textAnchor="middle">{label}</text>}
    </g>
  );
}
// NPN, base on the left, collector up, emitter down.
function NpnSym({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={13} {...sym} strokeWidth={1.5} />
      <line x1={x - 5} y1={y - 8} x2={x - 5} y2={y + 8} {...sym} strokeWidth={2.5} />
      <line x1={x - 14} y1={y} x2={x - 5} y2={y} {...sym} />
      <line x1={x - 5} y1={y - 4} x2={x + 6} y2={y - 13} {...sym} />
      <line x1={x - 5} y1={y + 4} x2={x + 6} y2={y + 13} {...sym} />
      <polygon points={`${x + 6},${y + 13} ${x + 1},${y + 12} ${x + 4},${y + 8}`} fill="#ddd" />
      <text x={x + 16} y={y - 6} fill="#999" fontSize="8">C</text>
      <text x={x - 22} y={y - 3} fill="#999" fontSize="8">B</text>
      <text x={x + 16} y={y + 14} fill="#999" fontSize="8">E</text>
    </g>
  );
}

const svgBox = { width: '100%', height: 100 };

const SCHEMATICS = {
  'first-light': (
    <svg viewBox="0 0 200 110" style={svgBox}>
      <path d="M 40 30 H 70" {...wire} />
      <ResistorSym x={88} y={30} label="330 Ω" />
      <path d="M 106 30 H 120" {...wire} />
      <LedSym x={132} y={30} />
      <path d="M 138 30 H 165 V 85 H 40 V 40" {...wire} />
      <Battery x={40} y={32} />
    </svg>
  ),
  'push-button-light': (
    <svg viewBox="0 0 200 110" style={svgBox}>
      <path d="M 40 30 H 70" {...wire} />
      <ResistorSym x={88} y={30} label="330 Ω" />
      <path d="M 106 30 H 120" {...wire} />
      <LedSym x={132} y={30} />
      <path d="M 138 30 H 165 V 85 H 120" {...wire} />
      <SwitchSym x={110} y={85} />
      <path d="M 100 85 H 40 V 40" {...wire} />
      <Battery x={40} y={32} />
    </svg>
  ),
  'parallel-leds': (
    <svg viewBox="0 0 200 110" style={svgBox}>
      <path d="M 40 22 H 62" {...wire} />
      <ResistorSym x={80} y={22} label="R1 330 Ω" />
      <path d="M 98 22 H 120" {...wire} />
      <LedSym x={132} y={22} />
      <path d="M 138 22 H 165 V 92 H 40 V 38" {...wire} />
      <path d="M 52 22 V 60 H 62" {...wire} />
      <ResistorSym x={80} y={60} label="R2 330 Ω" />
      <path d="M 98 60 H 120" {...wire} />
      <LedSym x={132} y={60} color="#33cc55" />
      <path d="M 138 60 H 165" {...wire} />
      <circle cx={52} cy={22} r={2.5} fill="#7db87d" />
      <circle cx={165} cy={60} r={2.5} fill="#7db87d" />
      <Battery x={40} y={24} />
    </svg>
  ),
  'voltage-divider': (
    <svg viewBox="0 0 200 110" style={svgBox}>
      <path d="M 40 25 H 70" {...wire} />
      <ResistorSym x={88} y={25} label="R1 = 1 kΩ" />
      <path d="M 106 25 H 150 V 45" {...wire} />
      <circle cx={150} cy={52} r={2.5} fill="#3b82f6" />
      <text x={158} y={56} fill="#3b82f6" fontSize="9">V/2</text>
      <path d="M 150 60 V 68" {...wire} />
      <g transform="rotate(90 150 85)"><ResistorSym x={150} y={85} label="" /></g>
      <text x={122} y={88} fill="#999" fontSize="9">R2 = 1 kΩ</text>
      <path d="M 150 103 V 105 H 40 V 35" {...wire} />
      <Battery x={40} y={27} />
    </svg>
  ),
  'polarity-protection': (
    <svg viewBox="0 0 200 110" style={svgBox}>
      <path d="M 40 30 H 58" {...wire} />
      <DiodeSym x={66} y={30} label="D1" />
      <path d="M 72 30 H 82" {...wire} />
      <ResistorSym x={100} y={30} label="330 Ω" />
      <path d="M 118 30 H 132" {...wire} />
      <LedSym x={144} y={30} />
      <path d="M 150 30 H 170 V 85 H 40 V 40" {...wire} />
      <Battery x={40} y={32} />
    </svg>
  ),
  'and-gate': (
    <svg viewBox="0 0 200 110" style={svgBox}>
      <path d="M 40 30 H 70" {...wire} />
      <ResistorSym x={88} y={30} label="330 Ω" />
      <path d="M 106 30 H 120" {...wire} />
      <LedSym x={132} y={30} />
      <path d="M 138 30 H 170 V 85 H 150" {...wire} />
      <SwitchSym x={140} y={85} label="S2" />
      <path d="M 130 85 H 110" {...wire} />
      <SwitchSym x={100} y={85} label="S1" />
      <path d="M 90 85 H 40 V 40" {...wire} />
      <Battery x={40} y={32} />
    </svg>
  ),
  'or-gate': (
    <svg viewBox="0 0 200 110" style={svgBox}>
      <path d="M 40 22 H 70" {...wire} />
      <ResistorSym x={88} y={22} label="330 Ω" />
      <path d="M 106 22 H 120" {...wire} />
      <LedSym x={132} y={22} color="#ddbb22" />
      <path d="M 138 22 H 170 V 70 H 150" {...wire} />
      <SwitchSym x={140} y={70} label="S1" />
      <path d="M 130 70 H 110" {...wire} />
      <path d="M 170 70 V 95 H 150" {...wire} />
      <SwitchSym x={140} y={95} label="S2" />
      <path d="M 130 95 H 110 V 70" {...wire} />
      <path d="M 110 70 H 40 V 32" {...wire} />
      <circle cx={170} cy={70} r={2.5} fill="#7db87d" />
      <circle cx={110} cy={70} r={2.5} fill="#7db87d" />
      <Battery x={40} y={24} />
    </svg>
  ),
  'transistor-switch': (
    <svg viewBox="0 0 200 110" style={svgBox}>
      <path d="M 30 14 H 150 V 18" {...wire} />
      <g transform="rotate(90 150 36)"><ResistorSym x={150} y={36} label="" /></g>
      <text x={158} y={38} fill="#999" fontSize="9">330 Ω</text>
      <g transform="rotate(90 150 64)"><LedSym x={150} y={64} color="#33cc55" /></g>
      <path d="M 150 54 V 57 M 150 70 V 72" {...wire} />
      <NpnSym x={144} y={85} />
      <path d="M 150 98 V 104 H 30 V 30" {...wire} />
      <path d="M 60 14 V 44 H 66" {...wire} />
      <SwitchSym x={76} y={44} label="S1" />
      <path d="M 84 44 H 96 V 85 H 102" {...wire} />
      <g transform="rotate(0)"><ResistorSym x={116} y={85} label="1 kΩ" /></g>
      <circle cx={60} cy={14} r={2.5} fill="#7db87d" />
      <Battery x={30} y={16} />
    </svg>
  ),
};

// Circuit diagram for a project, or null when it doesn't have one.
export function Schematic({ id }) {
  return SCHEMATICS[id] || null;
}

// ---------------------------------------------------------------------------
// Breadboard layout: a top-down drawing of the half-size board.

const NX = 9;
const NZ = 5;
const P = 14;        // px per hole
const PAD = 12;

const px = (i) => PAD + (i + NX) * P;
const pz = (j) => PAD + (j + NZ) * P;

function Leads({ cells, color = '#aaa' }) {
  const [a, b] = [cells[0], cells[cells.length - 1]];
  return <line x1={px(a[0])} y1={pz(a[1])} x2={px(b[0])} y2={pz(b[1])} stroke={color} strokeWidth={1.4} />;
}

// Draws `children` centred between two cells and rotated along them.
function Along({ a, b, children }) {
  const cx = (px(a[0]) + px(b[0])) / 2;
  const cz = (pz(a[1]) + pz(b[1])) / 2;
  const angle = Math.atan2(pz(b[1]) - pz(a[1]), px(b[0]) - px(a[0])) * 180 / Math.PI;
  return <g transform={`translate(${cx} ${cz}) rotate(${angle})`}>{children}</g>;
}

function PartDrawing({ comp, stepNo }) {
  const cells = terminalCells(comp);
  const ref = comp.ref;
  const label = (x, y, text, anchor = 'middle') => (
    <text x={x} y={y} fill="#ddd" fontSize="8" fontWeight="600" textAnchor={anchor}
      style={{ paintOrder: 'stroke', stroke: '#101010', strokeWidth: 3 }}>{text}</text>
  );
  // Blue badge with the build step that places this part.
  const badgeAt = comp.type === 'PowerSupply'
    ? [px(Math.round(comp.position[0] / PITCH)), pz(Math.round(comp.position[2] / PITCH)) - 10]
    : [(px(cells[0][0]) + px(cells[cells.length - 1][0])) / 2, (pz(cells[0][1]) + pz(cells[cells.length - 1][1])) / 2 - 11];
  const badge = stepNo != null && (
    <g>
      <circle cx={badgeAt[0]} cy={badgeAt[1] - 3} r={5.5} fill="#3b82f6" />
      <text x={badgeAt[0]} y={badgeAt[1]} fill="white" fontSize="7" fontWeight="700" textAnchor="middle">{stepNo}</text>
    </g>
  );

  if (comp.type === 'PowerSupply') {
    const ci = Math.round(comp.position[0] / PITCH);
    const cj = Math.round(comp.position[2] / PITCH);
    return (
      <g>
        <rect x={px(ci - 3) - 5} y={pz(cj - 3) - 5} width={6 * P + 10} height={6 * P + 10} rx={4} fill="#5a5a5a" stroke="#888" />
        <rect x={px(ci) - 22} y={pz(cj) - 8} width={44} height={14} rx={2} fill="#0a2818" />
        <text x={px(ci)} y={pz(cj) + 2} fill="#33ee88" fontSize="8" textAnchor="middle" fontFamily="monospace">{comp.value ?? 5} V</text>
        <circle cx={px(cells[0][0])} cy={pz(cells[0][1])} r={5} fill="#ee2222" stroke="#fff" strokeWidth={1} />
        <circle cx={px(cells[1][0])} cy={pz(cells[1][1])} r={5} fill="#111" stroke="#fff" strokeWidth={1} />
        {label(px(cells[0][0]), pz(cells[0][1]) - 8, '+')}
        {label(px(cells[1][0]), pz(cells[1][1]) - 8, '−')}
        {label(px(ci), pz(cj - 3) + 6, ref)}
        {badge}
      </g>
    );
  }
  const [a, b] = [cells[0], cells[cells.length - 1]];
  const len = Math.hypot(px(b[0]) - px(a[0]), pz(b[1]) - pz(a[1]));
  const mid = [(px(a[0]) + px(b[0])) / 2, (pz(a[1]) + pz(b[1])) / 2];
  const vertical = a[0] === b[0];
  const tag = vertical
    ? label(mid[0] + 9, mid[1] + 3, ref, 'start')
    : label(mid[0], mid[1] + 14, ref);

  let body = null;
  if (comp.type === 'Resistor') {
    body = (
      <Along a={a} b={b}>
        <rect x={-len * 0.3} y={-3.5} width={len * 0.6} height={7} rx={3} fill="#d2b48c" stroke="#8b6f47" strokeWidth={0.8} />
        <rect x={-len * 0.18} y={-3.5} width={2} height={7} fill="#6b3a1a" />
        <rect x={-len * 0.08} y={-3.5} width={2} height={7} fill="#6b3a1a" />
      </Along>
    );
  } else if (comp.type === 'LED') {
    const hex = (LED_COLORS[comp.color] || LED_COLORS.red).hex;
    body = (
      <g>
        <circle cx={mid[0]} cy={mid[1]} r={6} fill={hex} stroke="#fff" strokeWidth={0.8} opacity={0.9} />
        <circle cx={px(a[0])} cy={pz(a[1])} r={2.2} fill="#ff5555" />
        <circle cx={px(b[0])} cy={pz(b[1])} r={2.2} fill="#5599ff" />
      </g>
    );
  } else if (comp.type === 'Diode') {
    body = (
      <Along a={a} b={b}>
        <rect x={-len * 0.3} y={-3.5} width={len * 0.6} height={7} rx={2} fill="#1a1a1a" stroke="#666" strokeWidth={0.8} />
        <rect x={len * 0.18} y={-3.5} width={3} height={7} fill="#ccc" />
      </Along>
    );
  } else if (comp.type === 'Switch') {
    body = (
      <g>
        <rect x={mid[0] - 7} y={mid[1] - 7} width={14} height={14} rx={2} fill="#555" stroke="#888" />
        <circle cx={mid[0]} cy={mid[1]} r={4} fill="#cc3333" />
      </g>
    );
  } else if (comp.type === 'Transistor') {
    const names = ['C', 'B', 'E'];
    body = (
      <g>
        <Along a={a} b={b}>
          <path d={`M ${-len * 0.45} 2 A ${len * 0.45} ${len * 0.45} 0 0 1 ${len * 0.45} 2 Z`} fill="#222" stroke="#777" strokeWidth={0.8} />
        </Along>
        {cells.map((c, k) => (
          <g key={k}>
            <circle cx={px(c[0])} cy={pz(c[1])} r={2.2} fill={['#ff9944', '#ffee55', '#5599ff'][k]} />
            <text x={px(c[0])} y={pz(c[1]) + (vertical ? 3 : 10)} dx={vertical ? -9 : 0} fill="#bbb" fontSize="6.5" textAnchor="middle">{names[k]}</text>
          </g>
        ))}
      </g>
    );
  }
  return (
    <g>
      <Leads cells={cells} />
      {body}
      {tag}
      {badge}
    </g>
  );
}

export function LayoutDiagram({ project, style }) {
  const comps = projectComponents(project);
  const blocked = blockedCells(comps);
  const placeStep = {};
  project.steps.forEach((s, k) => { if (s.place) placeStep[s.place] = k + 1; });
  const width = PAD * 2 + NX * 2 * P;
  const height = PAD * 2 + NZ * 2 * P;
  const holes = [];
  for (let i = -NX; i <= NX; i++) for (let j = -NZ; j <= NZ; j++) holes.push([i, j]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', display: 'block', ...style }} role="img" aria-label={`Breadboard layout for ${project.name}`}>
      <rect x={2} y={2} width={width - 4} height={height - 4} rx={8} fill="#f4f1ea" stroke="#d8d2c4" />
      {holes.map(([i, j]) => (
        <rect key={`${i},${j}`} x={px(i) - 1.6} y={pz(j) - 1.6} width={3.2} height={3.2} fill="#b9b3a6" />
      ))}
      {comps.filter((c) => c.type === 'Wire').map((c) => {
        const cells = terminalCells(c);
        const pts = routeCells(cells[0], cells[1], blocked);
        return (
          <g key={c.id}>
            <polyline points={pts.map(([i, j]) => `${px(i)},${pz(j)}`).join(' ')} fill="none" stroke="#22aa44" strokeWidth={2.4} strokeLinejoin="round" />
            {[pts[0], pts[pts.length - 1]].map(([i, j], k) => (
              <circle key={k} cx={px(i)} cy={pz(j)} r={2.6} fill="#118833" />
            ))}
          </g>
        );
      })}
      {comps.filter((c) => c.type !== 'Wire').map((c) => (
        <PartDrawing key={c.id} comp={c} stepNo={placeStep[c.ref]} />
      ))}
    </svg>
  );
}
