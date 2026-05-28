import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { Book, Info, Monitor, Layers } from 'lucide-react';

import Breadboard from './components/Breadboard';
import ComponentPalette from './components/ComponentPalette';
import InstrumentPanel from './components/InstrumentPanel';
import Textbook from './components/Textbook';
import { 
  Resistor, LED, Capacitor, Diode, Transistor, 
  IntegratedCircuit, Switch, PowerSupply, Antenna, Magnet, Wire 
} from './components/InteractiveComponents';

export default function App() {
  const [showTextbook, setShowTextbook] = useState(false);
  const [placedComponents, setPlacedComponents] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [boardType, setBoardType] = useState('HALF');

  const handleBoardClick = useCallback((point) => {
    if (!selectedType) return;
    
    const newComponent = {
      type: selectedType,
      position: [point.x, point.y + 0.1, point.z],
      id: Date.now(),
    };
    
    setPlacedComponents((prev) => [...prev, newComponent]);
    setSelectedType(null);
  }, [selectedType]);

  const removeSelected = () => {
    if (selectedIndex === null) return;
    setPlacedComponents(prev => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
  };

  const renderComponent = (comp, index) => {
    const props = {
      key: comp.id,
      position: comp.position,
      selected: selectedIndex === index,
      onSelect: () => setSelectedIndex(index)
    };

    switch (comp.type) {
      case 'Resistor': return <Resistor {...props} />;
      case 'LED': return <LED {...props} color="red" />;
      case 'Capacitor': return <Capacitor {...props} />;
      case 'Diode': return <Diode {...props} />;
      case 'Transistor': return <Transistor {...props} />;
      case 'IC': return <IntegratedCircuit {...props} />;
      case 'Switch': return <Switch {...props} />;
      case 'PowerSupply': return <PowerSupply {...props} />;
      case 'Antenna': return <Antenna {...props} />;
      case 'Magnet': return <Magnet {...props} />;
      case 'Wire': return <Wire {...props} />;
      default: return null;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0.6, 0.6, 0.6]} fov={40} />
        <color attach="background" args={['#0a0a0a']} />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[5, 5, 5]} angle={0.2} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4488ff" />
        
        <Physics gravity={[0, -9.8, 0]}>
          <Breadboard type={boardType} onClick={handleBoardClick} />
          {placedComponents.map((comp, index) => renderComponent(comp, index))}
        </Physics>

        <ContactShadows position={[0, -0.1, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />
        <OrbitControls 
          makeDefault 
          enableDamping 
          dampingFactor={0.05}
          minDistance={0.2}
          maxDistance={5}
          maxPolarAngle={Math.PI / 2}
        />
        <gridHelper args={[10, 40, 0x151515, 0x111111]} position={[0, -0.11, 0]} />
      </Canvas>

      {/* UI overlays */}
      <div className="ui-layer" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top Header */}
        <div style={{ 
          background: 'rgba(15, 15, 15, 0.98)', 
          color: 'white', 
          padding: '10px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #222'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#3b82f6', padding: '6px', borderRadius: '6px' }}>
              <Monitor size={20} color="white" />
            </div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              OpenCircuitry <span style={{ color: '#444', fontWeight: 400 }}>| Virtual Electronics Lab</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#1a1a1a', borderRadius: '6px', padding: '2px 8px', border: '1px solid #333' }}>
              <Layers size={14} color="#666" style={{ marginRight: '8px' }} />
              <select 
                value={boardType} 
                onChange={(e) => setBoardType(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#eee',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="MINI">Mini (170)</option>
                <option value="HALF">Half (400)</option>
                <option value="FULL">Full (830)</option>
              </select>
            </div>

            <button 
              onClick={() => setShowTextbook(!showTextbook)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px', 
                cursor: 'pointer', 
                backgroundColor: showTextbook ? '#3b82f6' : '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              <Book size={16} />
              {showTextbook ? 'Hide Textbook' : 'Lab Textbook'}
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
            <div style={{ width: '480px', height: '100%', pointerEvents: 'auto', borderLeft: '1px solid #222' }}>
              <Textbook />
            </div>
          ) : (
            <InstrumentPanel />
          )}
        </div>

        {/* Bottom Status Bar */}
        <div style={{ 
          background: 'rgba(10, 10, 10, 0.95)', 
          color: '#555', 
          padding: '6px 20px', 
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #222'
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Objects: {placedComponents.length}</span>
            <span>Controls: Rotate (Left), Pan (Right), Zoom (Scroll)</span>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00ff00' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff00' }} /> SIMULATOR ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
