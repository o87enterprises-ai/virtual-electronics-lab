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
      {lit && <pointLight position={[0, 0.05, 0]} color={color} intensity={glow * 0.5} distance={0.6} />}
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
      <Box castShadow args={[0.08, 0.04, 0.08]}><meshStandardMaterial color="#333" /></Box>
      <Cylinder args={[0.02, 0.02, 0.04]} position={[0, pressed ? 0.02 : 0.03, 0]}>
        <meshStandardMaterial color={pressed ? '#cc4444' : '#555'} />
      </Cylinder>
      <Highlight selected={selected} size={0.13} />
    </group>
  );
}

export function PowerSupply({ selected }) {
  return (
    <group>
      <Box castShadow args={[0.3, 0.2, 0.3]}><meshStandardMaterial color="#444" /></Box>
      <Box args={[0.04, 0.04, 0.04]} position={[-0.1, 0.05, 0.15]}><meshStandardMaterial color="red" /></Box>
      <Box args={[0.04, 0.04, 0.04]} position={[0.1, 0.05, 0.15]}><meshStandardMaterial color="black" /></Box>
      <Highlight selected={selected} size={0.38} />
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

export function Wire({ selected }) {
  return (
    <group>
      <Cylinder castShadow args={[0.005, 0.005, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#55ff55" />
      </Cylinder>
      <Highlight selected={selected} size={0.1} />
    </group>
  );
}
