import React from 'react';
import { 
  Zap, Radio, Circle, Layout, Trash2, Cpu, Power, 
  Wifi, Magnet as MagnetIcon, MousePointer2, ToggleLeft
} from 'lucide-react';

export default function ComponentPalette({ onSelect, selectedType, onRemove, hasSelection }) {
  const categories = [
    {
      name: 'Basic',
      items: [
        { id: 'Resistor', name: 'Resistor', icon: <Zap size={16} />, color: '#d2b48c' },
        { id: 'Capacitor', name: 'Capacitor', icon: <Radio size={16} />, color: '#333' },
        { id: 'LED', name: 'LED (Red)', icon: <Circle size={16} />, color: '#ff4444' },
        { id: 'Wire', name: 'Jumper Wire', icon: <MousePointer2 size={16} />, color: '#55ff55' },
      ]
    },
    {
      name: 'Semiconductors',
      items: [
        { id: 'Diode', name: 'Diode (1N4001)', icon: <ToggleLeft size={16} />, color: '#111' },
        { id: 'Transistor', name: 'Transistor (NPN)', icon: <Cpu size={16} />, color: '#222' },
        { id: 'IC', name: 'IC (555 Timer)', icon: <Cpu size={16} />, color: '#111' },
      ]
    },
    {
      name: 'Power & Others',
      items: [
        { id: 'PowerSupply', name: 'DC Power Supply', icon: <Power size={16} />, color: '#444' },
        { id: 'Switch', name: 'Push Button', icon: <ToggleLeft size={16} />, color: '#333' },
        { id: 'Antenna', name: 'Antenna', icon: <Wifi size={16} />, color: 'silver' },
        { id: 'Magnet', name: 'Magnet', icon: <MagnetIcon size={16} />, color: 'red' },
      ]
    }
  ];

  return (
    <div style={{
      width: 240,
      background: 'rgba(15, 15, 15, 0.95)',
      color: 'white',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      borderRight: '1px solid #333',
      pointerEvents: 'auto',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Layout size={20} className="text-blue-500" />
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Components</h3>
      </div>

      {categories.map((cat) => (
        <div key={cat.name}>
          <p style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            {cat.name}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {cat.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: selectedType === item.id ? '#3b82f6' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ color: selectedType === item.id ? 'white' : item.color, display: 'flex' }}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #333' }}>
        <button
          disabled={!hasSelection}
          onClick={onRemove}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px',
            background: hasSelection ? '#ef4444' : '#222',
            color: hasSelection ? 'white' : '#555',
            border: 'none',
            borderRadius: '6px',
            cursor: hasSelection ? 'pointer' : 'default',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          <Trash2 size={16} />
          <span>Remove Item</span>
        </button>
      </div>
    </div>
  );
}
