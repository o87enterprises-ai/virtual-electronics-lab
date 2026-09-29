import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere } from '@react-three/drei';

// Selection highlight, sized per component
const Highlight = ({ selected, size = 0.15, y = 0 }) => selected ? (
  <mesh position={[0, y, 0]}>
    <boxGeometry args={[size, size, size]} />
    <meshBasicMaterial color="#ffdd00" wireframe transparent opacity={0.35} />
  </mesh>
) : null;

export function Resistor({ selected }) {
  return (
    <group>
      <Cylinder castShadow args={[0.02, 0.02, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#d2b48c" />
      </Cylinder>
      <Box args={[0.3, 0.005, 0.005]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} />
    </group>
  );
}

export function LED({ color = 'red', current = 0, selected }) {
  const lit = current > 1e-4;
  const glow = Math.min(current / 0.01, 1);
  return (
    <group>
      <mesh castShadow position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3 + glow * 3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* tight falloff: a lit LED should glow locally, not floodlight the board */}
      {lit && <pointLight position={[0, 0.05, 0]} color={color} intensity={glow * 0.12} distance={0.14} decay={2} />}
      <Cylinder args={[0.025, 0.025, 0.01]} position={[0, 0.02, 0]}><meshStandardMaterial color={color} /></Cylinder>
      {/* legs one hole either side of center: anode −x, cathode +x */}
      <Box args={[0.005, 0.05, 0.005]} position={[-0.05, 0, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.005, 0.04, 0.005]} position={[0.05, -0.005, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.1, 0.004, 0.004]} position={[0, 0.022, 0]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} size={0.12} y={0.03} />
    </group>
  );
}

export function Capacitor({ selected }) {
  return (
    <group>
      <Cylinder castShadow args={[0.03, 0.03, 0.08]}><meshStandardMaterial color="#222" /></Cylinder>
      <Box args={[0.005, 0.05, 0.005]} position={[-0.05, -0.05, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.005, 0.05, 0.005]} position={[0.05, -0.05, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.1, 0.004, 0.004]} position={[0, -0.03, 0]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} size={0.12} />
    </group>
  );
}

export function Diode({ selected }) {
  return (
    <group>
      <Cylinder castShadow args={[0.02, 0.02, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#111" />
      </Cylinder>
      <Box args={[0.01, 0.04, 0.04]} position={[0.03, 0, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.2, 0.005, 0.005]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} size={0.12} />
    </group>
  );
}

export function Transistor({ selected }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <Box args={[0.06, 0.06, 0.01]} position={[0, 0.03, 0]}><meshStandardMaterial color="#222" /></Box>
      {/* legs splay out to one hole apart: collector −x, base centre, emitter +x */}
      {[-0.05, 0, 0.05].map((x, i) => (
        <group key={i}>
          <Box args={[0.005, 0.06, 0.005]} position={[x, -0.02, 0]}><meshStandardMaterial color="silver" /></Box>
          <Box args={[Math.abs(x) + 0.005, 0.004, 0.004]} position={[x / 2, 0.008, 0]}><meshStandardMaterial color="silver" /></Box>
        </group>
      ))}
      <Highlight selected={selected} size={0.12} y={0.02} />
    </group>
  );
}

export function IntegratedCircuit({ pins = 8, selected }) {
  const width = pins === 8 ? 0.15 : 0.3;
  return (
    <group>
      <Box castShadow args={[width, 0.05, 0.15]}><meshStandardMaterial color="#111" /></Box>
      <Box args={[0.02, 0.01, 0.02]} position={[-width / 2 + 0.02, 0.025, 0]}><meshStandardMaterial color="#333" /></Box>
      <Highlight selected={selected} size={0.2} />
    </group>
  );
}

export function Switch({ pressed = false, selected }) {
  return (
    <group>
      <Box castShadow args={[0.08, 0.04, 0.08]}><meshStandardMaterial color="#555" /></Box>
      {/* big knob: glowing green when ON, red when OFF */}
      <Cylinder args={[0.024, 0.026, 0.045]} position={[0, pressed ? 0.022 : 0.035, 0]}>
        <meshStandardMaterial
          color={pressed ? '#22cc55' : '#cc3333'}
          emissive={pressed ? '#22cc55' : '#661111'}
          emissiveIntensity={pressed ? 0.9 : 0.35}
        />
      </Cylinder>
      {/* ON indicator lamp on the body */}
      <Box args={[0.014, 0.006, 0.014]} position={[0.028, 0.023, 0.028]}>
        <meshStandardMaterial
          color={pressed ? '#66ff99' : '#331111'}
          emissive={pressed ? '#33ff77' : '#000000'}
          emissiveIntensity={pressed ? 1.2 : 0}
        />
      </Box>
      {pressed && <pointLight color="#33ff77" intensity={0.06} distance={0.1} decay={2} position={[0, 0.05, 0]} />}
      <Highlight selected={selected} size={0.13} />
    </group>
  );
}

export function PowerSupply({ on = true, selected }) {
  return (
    <group>
      {/* Deliberately low-profile so it never hides the circuit behind it. */}
      <Box castShadow args={[0.26, 0.11, 0.26]}><meshStandardMaterial color="#9a9a9a" roughness={0.5} /></Box>
      {/* front panel with a display that goes dark when the output is off */}
      <Box args={[0.24, 0.095, 0.006]} position={[0, 0, 0.132]}><meshStandardMaterial color="#333" /></Box>
      <Box args={[0.13, 0.03, 0.004]} position={[0, 0.03, 0.137]}>
        <meshStandardMaterial
          color={on ? '#0a2818' : '#111111'}
          emissive={on ? '#00cc66' : '#000000'}
          emissiveIntensity={on ? 0.7 : 0}
        />
      </Box>
      {/* power rocker on the panel: green = output live, dark red = off */}
      <Box args={[0.035, 0.022, 0.012]} position={[0.088, 0.032, 0.134]}>
        <meshStandardMaterial
          color={on ? '#22cc55' : '#552222'}
          emissive={on ? '#22cc55' : '#000000'}
          emissiveIntensity={on ? 1 : 0}
        />
      </Box>
      {/* binding posts: red = + (left), black = − (right) */}
      <Cylinder args={[0.019, 0.022, 0.05]} position={[-0.1, -0.025, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#ee2222" emissive="#771111" emissiveIntensity={0.5} />
      </Cylinder>
      <Cylinder args={[0.019, 0.022, 0.05]} position={[0.1, -0.025, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#151515" />
      </Cylinder>
      {/* geometric + and − labels above the posts */}
      <Box args={[0.026, 0.006, 0.004]} position={[-0.1, 0.012, 0.138]}><meshStandardMaterial color="white" /></Box>
      <Box args={[0.006, 0.026, 0.004]} position={[-0.1, 0.012, 0.138]}><meshStandardMaterial color="white" /></Box>
      <Box args={[0.026, 0.006, 0.004]} position={[0.1, 0.012, 0.138]}><meshStandardMaterial color="white" /></Box>
      <Highlight selected={selected} size={0.3} />
    </group>
  );
}

export function Antenna({ selected }) {
  return (
    <group>
      <Cylinder castShadow args={[0.005, 0.005, 0.4]}><meshStandardMaterial color="silver" /></Cylinder>
      <Sphere args={[0.01, 16, 16]} position={[0, 0.2, 0]}><meshStandardMaterial color="silver" /></Sphere>
      <Highlight selected={selected} size={0.1} />
    </group>
  );
}

export function Magnet({ selected, spinning = false, speed = 2 }) {
  const spin = useRef();
  useFrame((_, dt) => {
    if (spin.current && spinning) spin.current.rotation.y += dt * speed * 4;
  });
  return (
    <group>
      <group ref={spin}>
        <Box castShadow args={[0.1, 0.05, 0.05]} position={[-0.05, 0, 0]}><meshStandardMaterial color="red" /></Box>
        <Box castShadow args={[0.1, 0.05, 0.05]} position={[0.05, 0, 0]}><meshStandardMaterial color="blue" /></Box>
      </group>
      <Highlight selected={selected} size={0.24} />
    </group>
  );
}

// Enamelled copper wound on a core; legs two holes either side of centre.
// Glows faintly when current makes a magnetic field.
export function Coil({ selected, turns = 100, field = 0 }) {
  const rings = Math.min(4 + Math.round(turns / 40), 16);
  const glow = Math.min(field / 20, 1);
  return (
    <group>
      <Cylinder castShadow args={[0.012, 0.012, 0.14]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.03, 0]}>
        <meshStandardMaterial color="#555" />
      </Cylinder>
      {Array.from({ length: rings }, (_, k) => (
        <mesh key={k} position={[-0.06 + (0.12 * k) / Math.max(rings - 1, 1), 0.03, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.022, 0.004, 8, 20]} />
          <meshStandardMaterial color="#c8743a" metalness={0.6} roughness={0.35} emissive="#4488ff" emissiveIntensity={glow * 1.5} />
        </mesh>
      ))}
      {glow > 0.02 && <pointLight position={[0, 0.05, 0]} color="#4488ff" intensity={glow * 0.1} distance={0.2} decay={2} />}
      <Box args={[0.005, 0.03, 0.005]} position={[-0.1, 0.005, 0]}><meshStandardMaterial color="#c8743a" /></Box>
      <Box args={[0.005, 0.03, 0.005]} position={[0.1, 0.005, 0]}><meshStandardMaterial color="#c8743a" /></Box>
      <Box args={[0.04, 0.004, 0.004]} position={[-0.08, 0.02, 0]}><meshStandardMaterial color="#c8743a" /></Box>
      <Box args={[0.04, 0.004, 0.004]} position={[0.08, 0.02, 0]}><meshStandardMaterial color="#c8743a" /></Box>
      <Highlight selected={selected} size={0.22} y={0.02} />
    </group>
  );
}

// Homemade cell: + electrode (copper, or carbon rod) at −x, − electrode
// (zinc or aluminium) at +x, stuck into a lemon, a jar of salt water, or a
// dry-cell can.
export function Cell({ selected, metal = 'zn-cu' }) {
  const body = metal === 'zn-c'
    ? <Cylinder castShadow args={[0.028, 0.028, 0.09]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.03, 0]}><meshStandardMaterial color="#1c1c1c" /></Cylinder>
    : metal === 'al-cu'
      ? <Cylinder castShadow args={[0.045, 0.045, 0.06]} position={[0, 0.03, 0]}><meshStandardMaterial color="#6fb7ff" transparent opacity={0.45} /></Cylinder>
      : <mesh castShadow position={[0, 0.035, 0]} scale={[1.35, 0.85, 0.9]}><sphereGeometry args={[0.042, 20, 16]} /><meshStandardMaterial color="#f5d928" roughness={0.8} /></mesh>;
  const plus = metal === 'zn-c' ? '#222' : '#c8743a';
  const minus = metal === 'al-cu' ? '#d8d8dc' : '#9aa0a6';
  return (
    <group>
      {body}
      <Box castShadow args={[0.006, 0.07, 0.02]} position={[-0.04, 0.05, 0]}><meshStandardMaterial color={plus} metalness={0.6} /></Box>
      <Box castShadow args={[0.006, 0.07, 0.02]} position={[0.04, 0.05, 0]}><meshStandardMaterial color={minus} metalness={0.6} /></Box>
      <Box args={[0.06, 0.004, 0.004]} position={[-0.07, 0.085, 0]}><meshStandardMaterial color="#c8743a" /></Box>
      <Box args={[0.06, 0.004, 0.004]} position={[0.07, 0.085, 0]}><meshStandardMaterial color="#9aa0a6" /></Box>
      <Box args={[0.004, 0.09, 0.004]} position={[-0.1, 0.04, 0]}><meshStandardMaterial color="#c8743a" /></Box>
      <Box args={[0.004, 0.09, 0.004]} position={[0.1, 0.04, 0]}><meshStandardMaterial color="#9aa0a6" /></Box>
      <Highlight selected={selected} size={0.22} y={0.04} />
    </group>
  );
}

export function Speaker({ selected }) {
  return (
    <group>
      <Cylinder castShadow args={[0.04, 0.04, 0.02, 24]} position={[0, 0.02, 0]}><meshStandardMaterial color="#1a1a1a" /></Cylinder>
      <Cylinder args={[0.028, 0.028, 0.002, 24]} position={[0, 0.031, 0]}><meshStandardMaterial color="#444" /></Cylinder>
      <Box args={[0.005, 0.03, 0.005]} position={[-0.05, 0.005, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.005, 0.03, 0.005]} position={[0.05, 0.005, 0]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} size={0.12} y={0.02} />
    </group>
  );
}

export function Mic({ selected }) {
  return (
    <group>
      <Cylinder castShadow args={[0.02, 0.02, 0.025, 20]} position={[0, 0.025, 0]}><meshStandardMaterial color="#111" /></Cylinder>
      <Cylinder args={[0.017, 0.017, 0.002, 20]} position={[0, 0.038, 0]}><meshStandardMaterial color="#3a3a3a" roughness={1} /></Cylinder>
      <Box args={[0.005, 0.03, 0.005]} position={[-0.05, 0.005, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.005, 0.03, 0.005]} position={[0.05, 0.005, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.1, 0.004, 0.004]} position={[0, 0.015, 0]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} size={0.12} y={0.02} />
    </group>
  );
}

// Jumper drawn along an auto-routed orthogonal path. `path` holds world-space
// offsets from the wire's start hole, including any corner points.
export function Wire({ path = [[0, 0], [0.3, 0]], selected }) {
  const color = selected ? '#aaffaa' : '#55ff55';
  const segments = [];
  for (let k = 0; k < path.length - 1; k++) {
    const [x1, z1] = path[k];
    const [x2, z2] = path[k + 1];
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len < 1e-6) continue;
    segments.push({
      k,
      len,
      mid: [(x1 + x2) / 2, (z1 + z2) / 2],
      angle: Math.atan2(-(z2 - z1), x2 - x1),
    });
  }
  const last = path.length - 1;
  return (
    <group>
      {segments.map((s) => (
        <group key={s.k} position={[s.mid[0], 0, s.mid[1]]} rotation={[0, s.angle, 0]}>
          <Cylinder castShadow args={[0.0065, 0.0065, s.len]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color={color} emissive={selected ? '#227722' : '#000000'} />
          </Cylinder>
        </group>
      ))}
      {path.map(([x, z], k) => {
        const endpoint = k === 0 || k === last;
        return (
          <Sphere key={k} args={[endpoint ? 0.011 : 0.0075, 10, 10]} position={[x, 0, z]}>
            <meshStandardMaterial
              color={endpoint ? '#22cc44' : color}
              emissive={endpoint ? '#116622' : '#000000'}
              emissiveIntensity={0.6}
            />
          </Sphere>
        );
      })}
    </group>
  );
}
