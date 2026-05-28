import { Box, Cylinder, Sphere } from '@react-three/drei';
import { useBox, useCylinder } from '@react-three/cannon';

// Common helper for selection highlight
const Highlight = ({ selected }) => selected ? (
  <mesh position={[0, 0, 0]}>
    <boxGeometry args={[0.15, 0.15, 0.15]} />
    <meshBasicMaterial color="#ffdd00" wireframe transparent opacity={0.3} />
  </mesh>
) : null;

export function Resistor({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 1, position, args: [0.2, 0.05, 0.05] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Cylinder args={[0.02, 0.02, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#d2b48c" />
      </Cylinder>
      <Box args={[0.3, 0.005, 0.005]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} />
    </group>
  );
}

export function LED({ position, color = "red", onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 1, position, args: [0.05, 0.1, 0.05] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      <Cylinder args={[0.025, 0.025, 0.01]} position={[0, 0.02, 0]}><meshStandardMaterial color={color} /></Cylinder>
      <Box args={[0.005, 0.05, 0.005]} position={[-0.01, 0, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.005, 0.04, 0.005]} position={[0.01, -0.005, 0]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} />
    </group>
  );
}

export function Capacitor({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 1, position, args: [0.06, 0.1, 0.06] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Cylinder args={[0.03, 0.03, 0.08]}><meshStandardMaterial color="#222" /></Cylinder>
      <Box args={[0.005, 0.05, 0.005]} position={[-0.01, -0.05, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.005, 0.05, 0.005]} position={[0.01, -0.05, 0]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} />
    </group>
  );
}

export function Diode({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 1, position, args: [0.15, 0.05, 0.05] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Cylinder args={[0.02, 0.02, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#111" />
      </Cylinder>
      <Box args={[0.01, 0.04, 0.04]} position={[0.03, 0, 0]}><meshStandardMaterial color="silver" /></Box>
      <Box args={[0.25, 0.005, 0.005]}><meshStandardMaterial color="silver" /></Box>
      <Highlight selected={selected} />
    </group>
  );
}

export function Transistor({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 1, position, args: [0.06, 0.1, 0.06] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <Box args={[0.06, 0.06, 0.01]} position={[0, 0.03, 0]}><meshStandardMaterial color="#222" /></Box>
      {[ -0.015, 0, 0.015 ].map((x, i) => (
        <Box key={i} args={[0.005, 0.06, 0.005]} position={[x, -0.02, 0]}><meshStandardMaterial color="silver" /></Box>
      ))}
      <Highlight selected={selected} />
    </group>
  );
}

export function IntegratedCircuit({ position, pins = 8, onSelect, selected }) {
  const width = pins === 8 ? 0.15 : 0.3;
  const [ref] = useBox(() => ({ mass: 1, position, args: [width, 0.05, 0.15] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Box args={[width, 0.05, 0.15]}><meshStandardMaterial color="#111" /></Box>
      <Box args={[0.02, 0.01, 0.02]} position={[-width/2 + 0.02, 0.025, 0]}><meshStandardMaterial color="#333" /></Box>
      <Highlight selected={selected} />
    </group>
  );
}

export function Switch({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 1, position, args: [0.1, 0.1, 0.1] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Box args={[0.08, 0.04, 0.08]}><meshStandardMaterial color="#333" /></Box>
      <Cylinder args={[0.02, 0.02, 0.04]} position={[0, 0.03, 0]}><meshStandardMaterial color="#555" /></Cylinder>
      <Highlight selected={selected} />
    </group>
  );
}

export function PowerSupply({ position, isAC = false, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 5, position, args: [0.3, 0.2, 0.3] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Box args={[0.3, 0.2, 0.3]}><meshStandardMaterial color="#444" /></Box>
      <Box args={[0.04, 0.04, 0.04]} position={[-0.1, 0.05, 0.15]}><meshStandardMaterial color="red" /></Box>
      <Box args={[0.04, 0.04, 0.04]} position={[0.1, 0.05, 0.15]}><meshStandardMaterial color="black" /></Box>
      <Highlight selected={selected} />
    </group>
  );
}

export function Antenna({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 1, position, args: [0.02, 0.4, 0.02] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Cylinder args={[0.005, 0.005, 0.4]}><meshStandardMaterial color="silver" /></Cylinder>
      <Sphere args={[0.01, 16, 16]} position={[0, 0.2, 0]}><meshStandardMaterial color="silver" /></Sphere>
      <Highlight selected={selected} />
    </group>
  );
}

export function Magnet({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 2, position, args: [0.2, 0.05, 0.05] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Box args={[0.1, 0.05, 0.05]} position={[-0.05, 0, 0]}><meshStandardMaterial color="red" /></Box>
      <Box args={[0.1, 0.05, 0.05]} position={[0.05, 0, 0]}><meshStandardMaterial color="blue" /></Box>
      <Highlight selected={selected} />
    </group>
  );
}

export function Wire({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({ mass: 0.1, position, args: [0.3, 0.01, 0.01] }));
  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Cylinder args={[0.005, 0.005, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#55ff55" />
      </Cylinder>
      <Highlight selected={selected} />
    </group>
  );
}
