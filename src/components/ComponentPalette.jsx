import React from 'react';
import { MousePointer2, Zap, Radio, Circle, Layout, Trash2 } from 'lucide-react';

export default function ComponentPalette({ onSelect, selectedType, onRemove, hasSelection }) {
  const components = [
    { id: 'Resistor', name: 'Resistor', icon: <Zap size={18} />, color: '#d2b48c' },
    { id: 'LED', name: 'LED (Red)', icon: <Circle size={18} />, color: '#ff4444' },
    { id: 'Capacitor', name: 'Capacitor', icon: <Radio size={18} />, color: '#333' },
  ];

  return (
    <div style={{
      width: 220,
      background: 'rgba(20, 20, 20, 0.9)',
      color: 'white',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      borderRight: '1px solid #444',
      pointerEvents: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Layout size={20} className="text-blue-400" />
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Lab Assets</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '0 0 4px 0' }}>Select and click board to place</p>
        
        {components.map((comp) => (
          <button
            key={comp.id}
            onClick={() => onSelect(comp.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              background: selectedType === comp.id ? '#3b82f6' : '#2a2a2a',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ color: selectedType === comp.id ? 'white' : comp.color }}>
              {comp.icon}
            </span>
            <span style={{ fontSize: '0.9rem' }}>{comp.name}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #444' }}>
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
            background: hasSelection ? '#ef4444' : '#2a2a2a',
            opacity: hasSelection ? 1 : 0.5,
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: hasSelection ? 'pointer' : 'default',
          }}
        >
          <Trash2 size={18} />
          <span>Delete Selected</span>
        </button>
      </div>
    </div>
  );
}
