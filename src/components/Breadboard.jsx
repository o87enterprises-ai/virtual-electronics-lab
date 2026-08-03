import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export const PITCH = 0.05;          // hole spacing in world units
export const BOARD_TOP_Y = -0.075;  // top surface of the board

export const BOARD_TYPES = {
  MINI: { name: 'Mini (170 points)', size: [0.5, 0.05, 0.4], color: '#f0f0f0' },
  HALF: { name: 'Half (400 points)', size: [1.0, 0.05, 0.6], color: 'white' },
  FULL: { name: 'Full (830 points)', size: [2.0, 0.05, 0.6], color: 'white' },
};

// Snap a world-space point to the nearest hole, clamped to the board.
export function snapToGrid(point, board) {
  const [width, , depth] = board.size;
  const nx = Math.floor((width / 2 - PITCH / 2) / PITCH);
  const nz = Math.floor((depth / 2 - PITCH / 2) / PITCH);
  const clamp = (v, n) => Math.max(-n, Math.min(n, Math.round(v / PITCH))) * PITCH;
  return [clamp(point.x, nx), clamp(point.z, nz)];
}

function Holes({ width, depth }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const nx = Math.floor((width / 2 - PITCH / 2) / PITCH);
    const nz = Math.floor((depth / 2 - PITCH / 2) / PITCH);
    const pts = [];
    for (let i = -nx; i <= nx; i++)
      for (let j = -nz; j <= nz; j++)
        pts.push([i * PITCH, BOARD_TOP_Y + 0.001, j * PITCH]);
    return pts;
  }, [width, depth]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    positions.forEach((p, i) => {
      m.setPosition(p[0], p[1], p[2]);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh
      key={positions.length}
      ref={ref}
      args={[undefined, undefined, positions.length]}
      raycast={() => null}
    >
      <boxGeometry args={[0.012, 0.004, 0.012]} />
      <meshStandardMaterial color="#333" />
    </instancedMesh>
  );
}

export default function Breadboard({ type = 'HALF', onClick, onHover, onHoverEnd }) {
  const board = BOARD_TYPES[type] || BOARD_TYPES.HALF;
  const [width, height, depth] = board.size;

  return (
    <group>
      <mesh
        position={[0, -0.1, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          // Ignore the click that ends an orbit/pan or a component drag.
          if (e.delta > 4) return;
          onClick && onClick(e.point);
        }}
        onPointerMove={(e) => onHover && onHover(e.point)}
        onPointerOut={() => onHoverEnd && onHoverEnd()}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={board.color} />
      </mesh>
      <Holes width={width} depth={depth} />
    </group>
  );
}
