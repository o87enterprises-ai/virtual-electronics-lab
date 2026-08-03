import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';

// Rising, fading smoke puffs on a staggered loop.
function Smoke({ count = 6 }) {
  const refs = useRef([]);
  const seeds = useMemo(() => {
    // deterministic hash noise, so render stays pure
    const rand = (i, salt) => {
      const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      phase: i / count,
      dx: (rand(i, 1) - 0.5) * 0.03,
      dz: (rand(i, 2) - 0.5) * 0.03,
      speed: 0.55 + rand(i, 3) * 0.35,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    seeds.forEach((s, i) => {
      const m = refs.current[i];
      if (!m) return;
      const life = ((t * s.speed) + s.phase) % 1; // 0 → born, 1 → gone
      m.position.set(s.dx + Math.sin(t * 2 + i) * 0.008, 0.04 + life * 0.22, s.dz);
      const scale = 0.015 + life * 0.05;
      m.scale.setScalar(scale);
      m.material.opacity = 0.45 * (1 - life);
    });
  });

  return seeds.map((_, i) => (
    <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#666" transparent opacity={0} depthWrite={false} />
    </mesh>
  ));
}

// Orange flicker that reads as burning.
function FireLight() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.intensity = 0.35 + Math.abs(Math.sin(t * 17) * Math.sin(t * 7.3)) * 0.5;
  });
  return <pointLight ref={ref} color="#ff7722" distance={0.5} position={[0, 0.05, 0]} />;
}

// Attached at a faulted component's position. 'short' faults spark harder.
export default function FaultEffects({ position, kind }) {
  const sparky = kind === 'short' || kind === 'overcurrent';
  return (
    <group position={position}>
      <Smoke />
      <FireLight />
      <Sparkles
        count={sparky ? 26 : 10}
        scale={[0.14, 0.1, 0.14]}
        size={sparky ? 4 : 2.5}
        speed={2.5}
        color="#ffaa33"
        position={[0, 0.04, 0]}
      />
    </group>
  );
}
