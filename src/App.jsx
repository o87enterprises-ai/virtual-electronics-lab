import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { Book, Info, Monitor, Settings2 } from 'lucide-react';

import Breadboard from './components/Breadboard';
import ComponentPalette from './components/ComponentPalette';
import InstrumentPanel from './components/InstrumentPanel';
import Textbook from './components/Textbook';
import { Resistor, LED, Capacitor } from './components/InteractiveComponents';

export default function App() {
  const [showTextbook, setShowTextbook] = useState(false);
  const [placedComponents, setPlacedComponents] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [boardType, setBoardType] = useState('HALF');

  // Handle placing a component on the board
  const handleBoardClick = useCallback((point) => {
    if (!selectedType) return;
    
    const newComponent = {
      type: selectedType,
      position: [point.x, point.y + 0.1, point.z],
      id: Date.now(),
    };
    
    setPlacedComponents((prev) => [...prev, newComponent]);
    setSelectedType(null); // Reset selection after placement
  }, [selectedType]);

  const removeSelected = () => {
    if (selectedIndex === null) return;
    setPlacedComponents(prev => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#111' }}>
      <Canvas shadows camera={{ position: [0.5, 0.5, 0.5], fov: 45 }}>
        <color attach="background" args={['#111']} />
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Physics gravity={[0, -9.8, 0]}>
          <Breadboard type={boardType} onClick={handleBoardClick} />
          
          {placedComponents.map((comp, index) => {
            const props = {
              key: comp.id,
              position: comp.position,
              selected: selectedIndex === index,
              onSelect: () => setSelectedIndex(index)
            };
            
            if (comp.type === 'Resistor') return <Resistor {...props} />;
            if (comp.type === 'LED') return <LED {...props} color="red" />;
            if (comp.type === 'Capacitor') return <Capacitor {...props} />;
            return null;
          })}
        </Physics>

        <ContactShadows position={[0, -0.1, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        <OrbitControls makeDefault />
        <gridHelper args={[10, 50, 0x222222, 0x111111]} position={[0, -0.11, 0]} />
      </Canvas>

      {/* UI overlays */}
      <div className="ui-layer" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top Header */}
        <div style={{ 
          background: 'rgba(25, 25, 25, 0.95)', 
          color: 'white', 
          padding: '12px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #333'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Monitor size={24} className="text-blue-500" />
            <h1 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, letterSpacing: '0.5px' }}>
              OpenCircuitry <span style={{ color: '#666', fontWeight: 400 }}>| Virtual Lab</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={boardType} 
              onChange={(e) => setBoardType(e.target.value)}
              style={{
                background: '#2a2a2a',
                color: 'white',
                border: '1px solid #444',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="MINI">Mini Board</option>
              <option value="HALF">Half Board</option>
              <option value="FULL">Full Board</option>
            </select>

            <button 
              onClick={() => setShowTextbook(!showTextbook)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px', 
                cursor: 'pointer', 
                backgroundColor: showTextbook ? '#3b82f6' : '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '6px',
                color: 'white',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              <Book size={18} />
              {showTextbook ? 'Hide Textbook' : 'Open Textbook'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ComponentPalette 
            onSelect={setSelectedType} 
            selectedType={selectedType}
            onRemove={removeSelected}
            hasSelection={selectedIndex !== null}
          />
          
          <div style={{ flex: 1, pointerEvents: 'none' }} /> 
          
          {showTextbook ? (
            <div style={{ width: '450px', height: '100%', pointerEvents: 'auto', borderLeft: '1px solid #333' }}>
              <Textbook />
            </div>
          ) : (
            <InstrumentPanel />
          )}
        </div>

        {/* Bottom Status Bar */}
        <div style={{ 
          background: 'rgba(25, 25, 25, 0.9)', 
          color: '#888', 
          padding: '6px 20px', 
          fontSize: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #333'
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Components: {placedComponents.length}</span>
            <span>Current Board: {boardType}</span>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Info size={14} /> Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
