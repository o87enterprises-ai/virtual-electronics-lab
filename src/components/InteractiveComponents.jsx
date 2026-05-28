import { Box, Cylinder } from '@react-three/drei';
import { useBox } from '@react-three/cannon';

export function Resistor({ position, value = "1k", onSelect, selected }) {
  const [ref] = useBox(() => ({
    mass: 1,
    position,
    args: [0.2, 0.05, 0.05],
  }));

  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Resistor Body */}
      <Cylinder args={[0.02, 0.02, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color={selected ? "#ffdd00" : "#d2b48c"} />
      </Cylinder>
      {/* Leads */}
      <Box args={[0.3, 0.005, 0.005]}>
        <meshStandardMaterial color="silver" />
      </Box>
    </group>
  );
}

export function LED({ position, color = "red", onSelect, selected }) {
  const [ref] = useBox(() => ({
    mass: 1,
    position,
    args: [0.05, 0.1, 0.05],
  }));

  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* LED Bulb */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={selected ? 2 : 0.5} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
      {/* Base */}
      <Cylinder args={[0.025, 0.025, 0.01]} position={[0, 0.02, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      {/* Leads */}
      <Box args={[0.005, 0.05, 0.005]} position={[-0.01, 0, 0]}>
        <meshStandardMaterial color="silver" />
      </Box>
      <Box args={[0.005, 0.04, 0.005]} position={[0.01, -0.005, 0]}>
        <meshStandardMaterial color="silver" />
      </Box>
    </group>
  );
}

export function Capacitor({ position, onSelect, selected }) {
  const [ref] = useBox(() => ({
    mass: 1,
    position,
    args: [0.06, 0.1, 0.06],
  }));

  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Cylinder args={[0.03, 0.03, 0.08]}>
        <meshStandardMaterial color={selected ? "#ffdd00" : "#222"} />
      </Cylinder>
      <Box args={[0.005, 0.05, 0.005]} position={[-0.01, -0.05, 0]}>
        <meshStandardMaterial color="silver" />
      </Box>
      <Box args={[0.005, 0.05, 0.005]} position={[0.01, -0.05, 0]}>
        <meshStandardMaterial color="silver" />
      </Box>
    </group>
  );
}
