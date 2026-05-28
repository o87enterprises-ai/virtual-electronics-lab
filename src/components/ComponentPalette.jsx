export default function ComponentPalette() {
  return (
    <div style={{
      width: 200,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: 12,
      overflowY: 'auto',
      borderRight: '1px solid #555'
    }}>
      <h3>Components</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>Resistor</li>
        <li>Capacitor</li>
        <li>LED</li>
        <li>Transistor</li>
        <li>IC (555)</li>
        <li>Op-Amp</li>
        <li>Jumper Wire</li>
        <li>Power Supply</li>
        <li>Oscilloscope Probe</li>
      </ul>
    </div>
  );
}
