import { Box, Text } from '@react-three/drei';
import { useBox } from '@react-three/cannon';

export const BOARD_TYPES = {
  MINI: { name: 'Mini (170 points)', size: [0.5, 0.05, 0.4], color: '#f0f0f0' },
  HALF: { name: 'Half (400 points)', size: [1.0, 0.05, 0.6], color: 'white' },
  FULL: { name: 'Full (830 points)', size: [2.0, 0.05, 0.6], color: 'white' },
};

export default function Breadboard({ type = 'HALF', onClick }) {
  const board = BOARD_TYPES[type] || BOARD_TYPES.HALF;
  const [width, height, depth] = board.size;

  const [ref] = useBox(() => ({
    mass: 0,
    position: [0, -0.1, 0],
    args: [width, height, depth],
    type: 'Static',
  }));

  return (
    <group onClick={(e) => {
      e.stopPropagation();
      onClick && onClick(e.point);
    }}>
      <Box ref={ref} args={[width, height, depth]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color={board.color} />
      </Box>
      {/* Visual holes placeholder */}
      <gridHelper 
        args={[width, 20, 0x888888, 0xcccccc]} 
        position={[0, -0.07, 0]} 
        rotation={[0, 0, 0]} 
      />
    </group>
  );
}
