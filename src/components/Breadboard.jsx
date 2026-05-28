import { Box } from '@react-three/drei';
import { useBox } from '@react-three/cannon';

export default function Breadboard() {
  const [ref] = useBox(() => ({
    mass: 0,                 // static body
    position: [0, -0.1, 0],
    args: [1.2, 0.05, 0.6],
    type: 'Static',
  }));

  return (
    <Box ref={ref} args={[1.2, 0.05, 0.6]} position={[0, -0.1, 0]}>
      <meshStandardMaterial color="white" />
    </Box>
  );
}
