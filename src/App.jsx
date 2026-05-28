import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import Breadboard from './components/Breadboard';
import ComponentPalette from './components/ComponentPalette';
import InstrumentPanel from './components/InstrumentPanel';
import Textbook from './components/Textbook';

export default function App() {
  const [showTextbook, setShowTextbook] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL('./workers/spiceWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => console.log('SPICE result:', e.data);
    worker.postMessage({ netlist: 'V1 1 0 DC 5\nR1 1 0 1000\n.op' });
    return () => worker.terminate();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0.8, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <Physics gravity={[0, -9.8, 0]}>
          <Breadboard />
        </Physics>
        <OrbitControls makeDefault />
        <gridHelper args={[2, 20]} />
        <axesHelper />
      </Canvas>

      {/* Mock UI overlays */}
      <div className="ui-layer" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Virtual Electronics Lab</span>
          <button 
            onClick={() => setShowTextbook(!showTextbook)}
            style={{ 
              padding: '4px 12px', 
              cursor: 'pointer', 
              backgroundColor: showTextbook ? '#ff4444' : '#44ff44',
              border: 'none',
              borderRadius: '4px',
              color: 'black',
              fontWeight: 'bold'
            }}
          >
            {showTextbook ? 'Close Textbook' : 'Open Textbook'}
          </button>
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ComponentPalette />
          <div style={{ flex: 1 }} /> {/* canvas area */}
          {showTextbook ? (
            <div style={{ width: '40%', height: '100%', pointerEvents: 'auto' }}>
              <Textbook />
            </div>
          ) : (
            <InstrumentPanel />
          )}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px', textAlign: 'center' }}>
          Status: Ready
        </div>
      </div>
    </div>
  );
}
