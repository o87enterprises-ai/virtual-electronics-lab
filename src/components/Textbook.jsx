import { Footprints, Hammer } from 'lucide-react';
import { PROJECTS } from '../lib/projects';
import { PART_NAMES } from '../lib/coach';
import { LED_COLORS } from '../lib/simulate';
import { Schematic, LayoutDiagram } from './Diagrams';

const pre = { backgroundColor: '#eee', padding: '10px' };

// What each build checks out at, so readers can compare with the meter.
const EXPECTED = {
  'first-light': 'LED1 ≈ 9 mA at ≈ 2.0 V; R1 drops ≈ 3.0 V.',
  'push-button-light': 'Released: 0 mA and 5 V across S1. Pressed: LED1 ≈ 9 mA and ≈ 0 V across S1.',
  'parallel-leds': 'LED1 ≈ 9.1 mA, LED2 ≈ 8.5 mA, supply ≈ 17.7 mA (the sum).',
  'voltage-divider': '4.5 V across each resistor, 4.5 mA through both.',
  'polarity-protection': 'D1 drops ≈ 0.7 V; LED1 ≈ 7 mA. Turn D1 around and everything reads 0 mA.',
  'and-gate': 'LED1 ≈ 9 mA only with both S1 and S2 pressed; 0 mA otherwise.',
  'or-gate': 'LED1 ≈ 8.8 mA with either button pressed.',
  'transistor-switch': 'S1 pressed: I_B ≈ 4.2 mA, I_C ≈ 7.9 mA, V_CE ≈ 0.2 V (saturated). Released: everything 0.',
};

const scrollTo = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// "1 × 330 Ω resistor" style parts list from a project's layout.
function billOfMaterials(project) {
  const rows = new Map();
  for (const p of project.parts) {
    let name = PART_NAMES[p.type] || p.type;
    if (p.type === 'Resistor') name = `${p.value >= 1000 ? `${p.value / 1000} kΩ` : `${p.value} Ω`} resistor`;
    else if (p.type === 'LED') name = `${(LED_COLORS[p.color] || LED_COLORS.red).label.toLowerCase()} LED`;
    else if (p.type === 'PowerSupply') name = `DC power supply, set to ${p.value} V`;
    else if (p.type === 'Diode') name = '1N4001 diode';
    else if (p.type === 'Transistor') name = 'NPN transistor';
    else if (p.type === 'Wire') name = 'jumper wire';
    const refs = rows.get(name) || { count: 0, refs: [] };
    refs.count++;
    if (p.ref) refs.refs.push(p.ref);
    rows.set(name, refs);
  }
  return [...rows.entries()];
}

const btn = (primary) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 6,
  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'system-ui, sans-serif',
  border: primary ? 'none' : '1px solid #bbb', background: primary ? '#3b82f6' : 'white',
  color: primary ? 'white' : '#333',
});

function BuildGuide({ project, number, onStartProject }) {
  return (
    <section id={`guide-${project.id}`} style={{ marginTop: 28 }}>
      <h3 style={{ marginBottom: 4 }}>W.{number} {project.name}</h3>
      <p style={{ margin: 0, fontStyle: 'italic', color: '#666' }}>{project.difficulty} · {project.steps.length} steps · {project.tagline}</p>
      <p><strong>You&apos;ll learn:</strong> {project.learn}</p>

      <p style={{ marginBottom: 4 }}><strong>Parts list</strong></p>
      <ul style={{ marginTop: 0 }}>
        {billOfMaterials(project).map(([name, r]) => (
          <li key={name}>{r.count} × {name}{r.refs.length ? ` (${r.refs.join(', ')})` : ''}</li>
        ))}
      </ul>

      <p style={{ marginBottom: 4 }}><strong>Schematic</strong></p>
      <div style={{ background: '#161616', borderRadius: 6, padding: 8, maxWidth: 360 }}>
        <Schematic id={project.id} />
      </div>

      <p style={{ marginBottom: 4 }}><strong>Breadboard layout</strong> (top view; blue numbers = the step that places each part)</p>
      <div style={{ maxWidth: 420 }}>
        <LayoutDiagram project={project} />
      </div>

      <p style={{ marginBottom: 4 }}><strong>Build it</strong></p>
      <ol style={{ marginTop: 0 }}>
        {project.steps.map((s, k) => <li key={k}>{s.text}</li>)}
      </ol>

      {EXPECTED[project.id] && (
        <p><strong>Check your readings:</strong> {EXPECTED[project.id]}</p>
      )}
      {project.explore?.length > 0 && (
        <>
          <p style={{ marginBottom: 4 }}><strong>Try next</strong></p>
          <ul style={{ marginTop: 0 }}>
            {project.explore.map((t, k) => <li key={k}>{t}</li>)}
          </ul>
        </>
      )}
      {onStartProject && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btn(true)} onClick={() => onStartProject(project, 'guided')}>
            <Footprints size={14} /> Guide me on the board
          </button>
          <button style={btn(false)} onClick={() => onStartProject(project, 'auto')}>
            <Hammer size={14} /> Build it for me
          </button>
        </div>
      )}
    </section>
  );
}

const Textbook = ({ onStartProject }) => {
  const guides = PROJECTS.filter((p) => p.buildable);
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      color: '#333',
      overflowY: 'auto',
      fontFamily: 'serif',
      lineHeight: '1.6',
      borderLeft: '1px solid #ddd'
    }}>
      <h1 style={{ textAlign: 'center' }}>Virtual Electronics Lab – Interactive Textbook</h1>
      <p style={{ textAlign: 'center', fontStyle: 'italic' }}>Learn Electrical Engineering Hands‑On, Zero Risk</p>
      
      <hr />

      <h2>Preface</h2>
      <p>
        Welcome to the <strong>Virtual Electronics Lab Textbook</strong> – your companion to the 3D simulation environment. This book teaches the fundamentals of electrical engineering through theory, diagrams, and practical circuit projects that you can build immediately inside the virtual lab. Because all experiments are simulated, you can explore without fear of damaging components or harming yourself.
      </p>
      <p>
        Every circuit in this book is ready to be assembled on your virtual breadboard. The diagrams are schematic representations; the instructions show you exactly where to place components and how to wire them. As you progress from simple LED circuits to microcontroller-based devices, you’ll develop an intuitive understanding of voltage, current, and the behaviour of real electronic parts.
      </p>

      <hr />

      <h2>Table of Contents</h2>
      <ol>
        <li><strong>Chapter 1 – Electricity: The Invisible River</strong>
          <ul>
            <li>1.1 Charge, Voltage, and Current</li>
            <li>1.2 Resistance and Ohm’s Law</li>
            <li>1.3 Power and Energy</li>
          </ul>
        </li>
        <li><strong>Chapter 2 – The Virtual Workbench</strong>
          <ul>
            <li>2.1 Instruments: Multimeter, Oscilloscope, Power Supply</li>
            <li>2.2 Reading Schematics and Breadboard Layouts</li>
            <li>2.3 Reading the Layout Diagrams in This Book</li>
          </ul>
        </li>
        <li><strong>Chapter 3 – Basic Components</strong>
          <ul>
            <li>3.1 Resistors – Colour Codes and Power Ratings</li>
            <li>3.2 Capacitors – Storing Charge</li>
            <li>3.3 Inductors – Magnetic Fields</li>
            <li>3.4 Diodes and LEDs – One‑Way Streets</li>
          </ul>
        </li>
        <li><strong>Chapter 4 – First Circuits</strong>
          <ul>
            <li>4.1 Lighting an LED (Series Resistor Calculation)</li>
            <li>4.2 Series and Parallel Resistor Networks</li>
            <li>4.3 Voltage Dividers</li>
            <li>4.4 Parallel Circuits – Branches</li>
            <li>4.5 Switches as Logic – AND and OR</li>
          </ul>
        </li>
        <li style={{ listStyle: 'none', margin: '6px 0 6px -18px' }}>
          <strong><a href="#workshop" onClick={scrollTo('workshop')} style={{ color: '#1d4ed8' }}>Workshop – Lab Build Guides</a></strong>
          <ul>
            <li><a href="#troubleshooting" onClick={scrollTo('troubleshooting')} style={{ color: '#1d4ed8' }}>W.0 Troubleshooting with the Circuit Coach</a></li>
            {guides.map((p, k) => (
              <li key={p.id}>
                <a href={`#guide-${p.id}`} onClick={scrollTo(`guide-${p.id}`)} style={{ color: '#1d4ed8' }}>W.{k + 1} {p.name}</a>
              </li>
            ))}
          </ul>
        </li>
        <li><strong>Chapter 5 – Semiconductor Devices</strong>
          <ul>
            <li>5.1 Bipolar Junction Transistors (BJT) as Switches</li>
            <li>5.2 Transistor Amplifier (Common Emitter)</li>
            <li>5.3 MOSFETs – Voltage‑Controlled Switches</li>
          </ul>
        </li>
        <li><strong>Chapter 6 – Operational Amplifiers</strong>
          <ul>
            <li>6.1 Ideal Op‑Amp Rules</li>
            <li>6.2 Inverting and Non‑Inverting Amplifiers</li>
            <li>6.3 Comparator and Schmitt Trigger</li>
          </ul>
        </li>
        <li><strong>Chapter 7 – Time‑Dependent Circuits</strong>
          <ul>
            <li>7.1 RC Circuits – Charging and Discharging</li>
            <li>7.2 555 Timer IC – Astable and Monostable Modes</li>
          </ul>
        </li>
        <li><strong>Chapter 8 – Digital Logic</strong>
          <ul>
            <li>8.1 Logic Gates, Truth Tables, Boolean Algebra</li>
            <li>8.2 Flip‑Flops, Counters, and Shift Registers</li>
          </ul>
        </li>
        <li><strong>Chapter 9 – Microcontrollers</strong>
          <ul>
            <li>9.1 Arduino Basics – Digital I/O and Analog Input</li>
            <li>9.2 PWM and Servo Control</li>
          </ul>
        </li>
        <li><strong>Chapter 10 – Advanced Projects</strong>
          <ul>
            <li>10.1 Audio Amplifier</li>
            <li>10.2 Temperature‑Controlled Fan</li>
            <li>10.3 Simple AM Radio Receiver</li>
          </ul>
        </li>
      </ol>

      <hr />

      <h2>Chapter 1 – Electricity: The Invisible River</h2>
      <h3>1.1 Charge, Voltage, and Current</h3>
      <p>
        Electricity is the flow of <strong>electric charge</strong>. Charge is carried by electrons (negative) or ions. In metal wires, the moving charges are electrons.
      </p>
      <p>
        <strong>Voltage (V)</strong> is the “push” that makes charges move. Think of it as the height of a waterfall: the higher the water, the more energy it has. Voltage is measured in <strong>volts (V)</strong>.
      </p>
      <p>
        <strong>Current (I)</strong> is the rate of flow of charge. It’s like the amount of water flowing past a point each second. Current is measured in <strong>amperes (A)</strong>.
      </p>
      <p>
        <strong>Analogy:</strong> A water tank with a pipe at the bottom.
      </p>
      <ul>
        <li>Voltage = water pressure (height of water)</li>
        <li>Current = flow rate (litres/second)</li>
        <li>Resistance = pipe’s narrowness (restricts flow)</li>
      </ul>

      <h3>1.2 Resistance and Ohm’s Law</h3>
      <p>
        Materials resist the flow of current. <strong>Resistance (R)</strong> is measured in <strong>ohms (Ω)</strong>.
      </p>
      <p>
        <strong>Ohm’s Law:</strong>
      </p>
      <pre style={pre}>V = I × R</pre>
      <p>
        If you know any two, you can calculate the third.
      </p>
      <p>
        Example: A 5 V battery connected to a 1 kΩ resistor:
      </p>
      <pre style={pre}>I = V / R = 5 V / 1000 Ω = 0.005 A = 5 mA</pre>

      <h3>1.3 Power and Energy</h3>
      <p>
        <strong>Power (P)</strong> is the rate of energy conversion. In electrical terms:
      </p>
      <pre style={pre}>P = V × I   (watts)</pre>
      <p>
        Using Ohm’s law, also:
      </p>
      <pre style={pre}>P = I² × R = V² / R</pre>
      <p>
        Resistors dissipate power as heat. Always choose a resistor with a power rating higher than the calculated value (typical: 1/4 W).
      </p>

      <hr />

      <h2>Chapter 2 – The Virtual Workbench</h2>
      <h3>2.1 Instruments</h3>
      <p>Your virtual lab contains exact replicas of real instruments:</p>
      <ul>
        <li><strong>Digital Multimeter (DMM):</strong> Measures DC/AC voltage, current, resistance, continuity. Probes must touch the nodes you wish to measure.</li>
        <li><strong>Oscilloscope:</strong> Visualises voltage over time. Connect the probe tip to a circuit node and the ground clip to the circuit’s ground.</li>
        <li><strong>Function Generator:</strong> Produces sine, square, triangle waves. Adjust frequency, amplitude, offset.</li>
        <li><strong>DC Power Supply:</strong> Provides adjustable voltage (0‑30 V) with current limiting.</li>
      </ul>

      <h3>2.2 Reading Schematics and Breadboard Layouts</h3>
      <p>
        A <strong>schematic</strong> uses symbols to represent components. Every circuit in this book is shown as both a schematic and a breadboard connection diagram.
      </p>
      <p><strong>Common symbols:</strong></p>
      <ul>
        <li>Resistor: zigzag line (or rectangle)</li>
        <li>Capacitor: two parallel plates</li>
        <li>LED: triangle with arrow and two small arrows (light)</li>
        <li>Transistor: circle with three connections</li>
        <li>Ground: three horizontal lines decreasing in length</li>
      </ul>
      <p>
        On a real <strong>breadboard</strong>, vertical power rails run along the sides (red for +, blue for −) and the inner holes are joined in strips of five by metal clips underneath.
      </p>
      <p>
        <strong>In this virtual lab, connections are stricter:</strong> two legs are connected only when they sit in the <em>exact same hole</em>, or when a jumper wire has one end in each of their holes. A wire only connects at its two ends, never where it passes over a hole. The green rings that appear while wiring mark holes where leads really meet.
      </p>

      <h3>2.3 Reading the Layout Diagrams in This Book</h3>
      <p>Every build in the Workshop chapter has a top-down breadboard layout drawn from the same data the lab uses, so it matches “Build it for me” exactly.</p>
      <ul>
        <li><strong>Grey box with red and black circles</strong>: the DC power supply. Red is the + post and black is the − post.</li>
        <li><strong>Tan bar</strong>: a resistor. Either leg can go either way.</li>
        <li><strong>Coloured circle with red and blue dots</strong>: an LED. The red dot is the + leg (anode) and the blue dot is the − leg (cathode).</li>
        <li><strong>Black bar with a silver stripe</strong>: a diode. The stripe marks the cathode (K).</li>
        <li><strong>Grey square</strong>: a push button.</li>
        <li><strong>Black half-circle with C, B and E</strong>: an NPN transistor, showing collector, base and emitter.</li>
        <li><strong>Green line</strong>: a jumper wire. The dark dots are its two ends, the only places it connects.</li>
        <li><strong>Blue numbered badge</strong>: the build step that places that part.</li>
      </ul>
      <p>You don&apos;t have to copy the positions exactly. The Circuit Coach checks <em>which legs are connected</em>, not where the parts sit.</p>

      <hr />

      <h2>Chapter 3 – Basic Components</h2>
      <h3>3.1 Resistors – Colour Codes and Power Ratings</h3>
      <p>Resistors limit current. Their value is indicated by coloured bands.</p>
      <p><strong>4‑band code:</strong></p>
      <ul>
        <li>1st band = 1st digit</li>
        <li>2nd band = 2nd digit</li>
        <li>3rd band = multiplier (×10ⁿ)</li>
        <li>4th band = tolerance (gold ±5%, silver ±10%)</li>
      </ul>
      <p>Example: Yellow‑Violet‑Red‑Gold → 4‑7‑×100 ±5% = 4700 Ω (4.7 kΩ).</p>

      <h3>3.2 Capacitors – Storing Charge</h3>
      <p>A capacitor stores energy in an electric field. Capacitance is measured in farads (F), usually µF, nF, pF.</p>
      <ul>
        <li>Electrolytic capacitors are polarised (longer lead is positive). Reversing them can cause failure (simulated with a visual smoke effect).</li>
        <li>Ceramic capacitors are non‑polarised.</li>
      </ul>

      <h3>3.3 Inductors – Magnetic Fields</h3>
      <p>Inductors resist changes in current. Measured in henries (H). Used in filters, transformers, and oscillators.</p>

      <h3>3.4 Diodes and LEDs – One‑Way Streets</h3>
      <p>Diodes allow current in one direction (anode to cathode). LEDs emit light when current flows. Always use a current‑limiting resistor in series.</p>
      <p>
        A conducting silicon diode drops about <strong>0.7 V</strong>, and an LED drops more, depending on its colour: roughly red 1.9 V, yellow 2.0 V, green 2.1 V and blue 3.0 V. Placed in series with the supply, a diode is a cheap <strong>reverse‑polarity guard</strong>. If the battery goes in backwards, the diode blocks the current and nothing downstream is damaged. Build it in Workshop W.5.
      </p>

      <hr />

      <h2>Chapter 4 – First Circuits</h2>
      <h3>4.1 Lighting an LED</h3>
      <p><strong>Schematic:</strong></p>
      <pre style={pre}>{`   +5V
    |
   [R]
    |
   LED (anode)
    |
   GND`}</pre>
      <p>
        Choose R to set current. For a red LED (forward voltage ~2 V) and desired 10 mA:<br />
        R = (5 V – 2 V) / 0.01 A = 300 Ω → use 330 Ω (standard value).
      </p>
      <p><strong>Breadboard layout:</strong></p>
      <ol>
        <li>Connect +5 V to power rail (red).</li>
        <li>Connect GND to blue rail.</li>
        <li>Insert resistor between a free row and the LED’s anode (long leg).</li>
        <li>Insert LED cathode (short leg) into a row connected to GND via jumper.</li>
        <li>Power on – the LED glows!</li>
      </ol>

      <h3>4.2 Series and Parallel Resistors</h3>
      <ul>
        <li><strong>Series:</strong> Rₑq = R₁ + R₂ + … (same current)</li>
        <li><strong>Parallel:</strong> 1/Rₑq = 1/R₁ + 1/R₂ + … (same voltage)</li>
      </ul>
      <p>Build a parallel resistor network and measure total resistance with the DMM (ohmmeter setting, power off!).</p>

      <h3>4.3 Voltage Dividers</h3>
      <pre style={pre}>{`        V_in
         |
        [R1]
         |
         +---- V_out
         |
        [R2]
         |
        GND`}</pre>
      <p>V_out = V_in * (R2 / (R1 + R2))</p>
      <p>Use two 10 kΩ resistors and 5 V input; V_out = 2.5 V.</p>

      <h3>4.4 Parallel Circuits – Branches</h3>
      <p>
        When parts sit on separate paths between the same two points, they are in <strong>parallel</strong>. Every branch gets the full supply voltage and works independently. The supply provides the <em>sum</em> of the branch currents:
      </p>
      <pre style={pre}>I_total = I_1 + I_2 + …</pre>
      <p>This is how house wiring works. Switching off one lamp doesn&apos;t affect the others. Give every LED branch its own resistor, because LEDs sharing one resistor fight over the current. Build it in Workshop W.3.</p>

      <h3>4.5 Switches as Logic – AND and OR</h3>
      <p>Two switches can be combined in two basic ways:</p>
      <ul>
        <li><strong>Series = AND.</strong> There is one path and both switches sit on it, so both must be closed for current to flow.</li>
        <li><strong>Parallel = OR.</strong> Each switch is its own path around the gap, so either one is enough.</li>
      </ul>
      <pre style={pre}>{`A B | AND | OR
0 0 |  0  |  0
0 1 |  0  |  1
1 0 |  0  |  1
1 1 |  1  |  1`}</pre>
      <p>Replace each button with a transistor and you have the logic gates inside every computer. Build them in Workshop W.6 and W.7.</p>

      <hr />

      <h2 id="workshop">Workshop – Lab Build Guides</h2>
      <p>
        These guides take you from a single LED to a transistor switch. Every build runs in the live simulator. Open <strong>Projects</strong> and choose <strong>Guide me</strong>, or use the buttons under each guide. The board is cleared and the <strong>Circuit Coach</strong> follows along. It ticks off each step as you finish it, shows a ghost of where the next part goes, and pulses the holes you still need to join.
      </p>

      <h3 id="troubleshooting">W.0 Troubleshooting with the Circuit Coach</h3>
      <p>
        When something doesn&apos;t work, open the <strong>Coach</strong> tab. It lists problems <em>in build order</em>, because the first thing that&apos;s wrong is usually what breaks everything after it. Each problem says what&apos;s wrong, why it matters, and how to fix it. Press <strong>Show me</strong> to have it select the part and pulse the holes involved.
      </p>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9em' }}>
        <thead>
          <tr>
            {['Symptom', 'Usual cause', 'Fix'].map((h) => (
              <th key={h} style={{ textAlign: 'left', borderBottom: '2px solid #bbb', padding: '4px 6px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['Nothing lights, no smoke', 'A leg or wire end is in a hole on its own, so the loop is open', 'Every connection must share a hole or have a jumper. Look for legs without a green ring.'],
            ['LED stays dark but the circuit looks right', 'The LED is in backwards', 'Click it and rotate 180°. The red dot (anode) must face +.'],
            ['LED flashes and smokes', 'No series resistor, or the resistor is too small', 'Add a 220 Ω – 1 kΩ resistor in series with it.'],
            ['Supply smokes, “short circuit”', 'A wire joins + to − with nothing in between', 'Find the path from + to − that skips every part, and break it.'],
            ['One part does nothing', 'Its two legs are joined by a wire (shorted out)', 'Remove the wire that runs from one of its legs to the other.'],
            ['Works only when a button is held', 'That\'s normal for a momentary push button', 'Press it from the part menu. It stays pressed until you tap again.'],
            ['Transistor never switches', 'Legs in the wrong order, or no base current', 'Check C-B-E order and that the base resistor reaches the middle leg.'],
          ].map((row) => (
            <tr key={row[0]}>
              {row.map((cell, k) => (
                <td key={k} style={{ borderBottom: '1px solid #ddd', padding: '4px 6px', verticalAlign: 'top' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {guides.map((p, k) => (
        <BuildGuide key={p.id} project={p} number={k + 1} onStartProject={onStartProject} />
      ))}

      <hr />

      <h2>Chapter 5 – Semiconductor Devices</h2>
      <h3>5.1 BJT as a Switch (NPN)</h3>
      <p>A small base current controls a larger collector current.</p>
      <p><strong>Circuit:</strong></p>
      <ul>
        <li>Base resistor (1 kΩ) to a push‑button to 5 V</li>
        <li>Collector to LED (with resistor) to 5 V</li>
        <li>Emitter to GND</li>
      </ul>
      <p>Pressing the button lights the LED. The transistor saturates (V_CE ≈ 0.2 V).</p>
      <p>
        <strong>Worked numbers (5 V supply).</strong> Base current I_B = (5 − 0.7) / 1 kΩ ≈ 4.3 mA. With a current gain β ≈ 100, the transistor <em>could</em> pass 430 mA, but the LED and its 330 Ω resistor only allow about (5 − 2.1 − 0.2) / 330 ≈ 8 mA. So the transistor is fully on, or <strong>saturated</strong>, and acts like a closed switch. Raise the base resistor to 100 kΩ and I_B falls to 43 µA. Now I_C = β × I_B ≈ 4 mA, so the transistor is <strong>amplifying</strong>. Never drive the base without a resistor: the base–emitter junction is a diode and will draw far too much current.
      </p>
      <p>Build it in Workshop W.8. The multimeter shows I_B, I_C and whether the transistor is off, amplifying or saturated.</p>

      <h3>5.2 Common‑Emitter Amplifier</h3>
      <p>Biased with a voltage divider, it amplifies small AC signals (e.g., from a microphone). Use a coupling capacitor on input/output.</p>

      <h3>5.3 MOSFETs (N‑channel enhancement)</h3>
      <p>Gate voltage controls drain‑source current. Gate draws almost no current. Use for motor control or high‑power switching.</p>

      <hr />

      <h2>Chapter 6 – Operational Amplifiers</h2>
      <h3>6.1 Ideal Op‑Amp Rules</h3>
      <ul>
        <li>Infinite input impedance (no current into inputs)</li>
        <li>Output does whatever needed to make the two inputs equal (virtual short)</li>
      </ul>

      <h3>6.2 Inverting Amplifier</h3>
      <pre style={pre}>{`        R2
   +---/\\/\\/\\---+
   |            |
  Vin o---R1----+---(-) OpAmp --> Vout
                |
               GND`}</pre>
      <p>Gain = –R2 / R1</p>

      <h3>6.3 Non‑Inverting Amplifier</h3>
      <p>Gain = 1 + R2 / R1</p>
      <p>Build a non‑inverting amplifier with gain 2, supply ±12 V, and verify with oscilloscope.</p>

      <h3>6.4 Comparator & Schmitt Trigger</h3>
      <p>Without feedback, the op‑amp saturates high or low depending on which input is higher. Add positive feedback for hysteresis (Schmitt trigger).</p>

      <hr />

      <h2>Chapter 7 – Time‑Dependent Circuits</h2>
      <h3>7.1 RC Charging/Discharging</h3>
      <pre style={pre}>{`   +5V --- R ---+---- to scope probe
                |
               C
                |
               GND`}</pre>
      <p>Voltage across C: Vc(t) = V (1 – e⁻ᵗ/ᴿᶜ)<br />
      Time constant τ = R × C. After 5τ, the capacitor is ~99% charged.</p>

      <h3>7.2 555 Timer – Astable (Oscillator)</h3>
      <p>Produces a square wave. Frequency set by two resistors and a capacitor.</p>
      <pre style={pre}>f = 1.44 / ((R1 + 2R2) × C)</pre>
      <p>Build a 1 Hz LED flasher with R1=1 kΩ, R2=10 kΩ, C=100 µF.</p>
      <p><strong>Monostable (one-shot):</strong> Output pulse length t = 1.1 × R × C. Use as a touch timer.</p>

      <hr />

      <h2>Chapter 8 – Digital Logic</h2>
      <h3>8.1 Logic Gates</h3>
      <p>AND, OR, NOT, NAND, NOR, XOR, XNOR. Truth tables define outputs. Use a DIP switch for inputs and LEDs for outputs to experiment with a 74HC00 quad NAND gate IC.</p>

      <h3>8.2 Flip‑Flops, Counters</h3>
      <p>A D‑flip‑flop stores one bit. Chain them for a binary counter. Use a 555 timer as a clock input and a CD4026 decimal counter with 7‑segment display.</p>

      <hr />

      <h2>Chapter 9 – Microcontrollers</h2>
      <h3>9.1 Arduino Basics</h3>
      <p>In the virtual lab, an Arduino Uno is modelled. You can write code in a built‑in editor (C/C++). Start with <strong>Blink</strong>: digital pin 13 toggles an LED.</p>
      <p>
        <strong>Digital I/O:</strong> <code>pinMode(pin, OUTPUT)</code>, <code>digitalWrite(pin, HIGH)</code>.<br />
        <strong>Analog Input:</strong> <code>analogRead(A0)</code> returns 0‑1023 (0‑5 V).
      </p>

      <h3>9.2 PWM and Servo Control</h3>
      <p>PWM (Pulse Width Modulation) dims LEDs or controls motor speed. A servo motor is positioned by sending a 50 Hz signal with pulse width between 1 ms and 2 ms.</p>

      <hr />

      <h2>Chapter 10 – Advanced Projects</h2>
      <h3>10.1 Audio Amplifier</h3>
      <p>Combine a pre‑amplifier (op‑amp) with a push‑pull output stage (transistors). Input from a smartphone jack, output to a small speaker. Observe signal on oscilloscope.</p>

      <h3>10.2 Temperature‑Controlled Fan</h3>
      <p>Sensor (thermistor) → voltage divider → ADC (Arduino) → compare with setpoint → PWM to fan. Display temperature on LCD.</p>

      <h3>10.3 Simple AM Radio Receiver</h3>
      <p>A ferrite rod antenna, a variable capacitor, a germanium diode detector, and a high‑impedance earphone. Tune to local AM stations. Visualise the demodulated waveform.</p>

      <hr />

      <p><strong>Congratulations!</strong> You’ve journeyed from basic electron flow to building real‑world electronic systems. The virtual lab is your sandbox – keep experimenting, modifying, and inventing. Every great engineer started with a single LED.</p>
      <p style={{ fontStyle: 'italic' }}>Next: Advanced topics – PCB design, surface‑mount components, and the physics of semiconductors – are unlocked as you progress. Happy building!</p>

      <hr />
      <p style={{ fontSize: 'small', textAlign: 'center' }}>
        *This textbook is integrated into the Virtual Electronics Lab simulation. Every Workshop circuit can be built on the board with the Circuit Coach checking your work. Keep the Textbook tab open beside the board while you build.*
      </p>
    </div>
  );
};

export default Textbook;
