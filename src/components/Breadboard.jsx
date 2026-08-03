import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PITCH, BOARD_TOP_Y, BOARD_TYPES } from '../lib/constants';

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
