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
      {[-0.015, 0, 0.015].map((x, i) => (
        <Box key={i} args={[0.005, 0.06, 0.005]} position={[x, -0.02, 0]}><meshStandardMaterial color="silver" /></Box>
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

export function Magnet({ selected }) {
  return (
    <group>
      <Box castShadow args={[0.1, 0.05, 0.05]} position={[-0.05, 0, 0]}><meshStandardMaterial color="red" /></Box>
      <Box castShadow args={[0.1, 0.05, 0.05]} position={[0.05, 0, 0]}><meshStandardMaterial color="blue" /></Box>
      <Highlight selected={selected} size={0.24} />
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
