import React from 'react';

const Textbook = () => {
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
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>V = I × R</pre>
      <p>
        If you know any two, you can calculate the third.
      </p>
      <p>
        Example: A 5 V battery connected to a 1 kΩ resistor:
      </p>
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>I = V / R = 5 V / 1000 Ω = 0.005 A = 5 mA</pre>

      <h3>1.3 Power and Energy</h3>
      <p>
        <strong>Power (P)</strong> is the rate of energy conversion. In electrical terms:
      </p>
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>P = V × I   (watts)</pre>
      <p>
        Using Ohm’s law, also:
      </p>
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>P = I² × R = V² / R</pre>
      <p>
        Resistors dissipate power as heat. Always choose a resistor with a power rating higher than the calculated value (typical: 1/4 W).
      </p>

      <hr />

      <h2>Chapter 2 – The Virtual Workbench</h2>
      <h3>2.1 Instruments</h3>
      <p>Your virtual lab contains exact replicas of real instruments:</p>
      <ul>
        <li><strong>Digital Multimeter (DMM):</strong> Measures DC/AC voltage, current, resistance, continuity. Probes must touch the nodes you wish to measure.</li>
        <li><strong>Oscilloscope:</strong> Visualises voltage over time. Connect the probe tip to a circuit node and the ground clip to the circuit’s ground.</li>
        <li><strong>Function Generator:</strong> Produces sine, square, triangle waves. Adjust frequency, amplitude, offset.</li>
        <li><strong>DC Power Supply:</strong> Provides adjustable voltage (0‑30 V) with current limiting.</li>
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
        On a <strong>breadboard</strong>, vertical power rails run along the sides (red for +, blue for -). The inner rows are connected in groups of five holes horizontally. Components are plugged into these holes, and jumper wires complete the connections.
      </p>

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
      <p>Example: Yellow‑Violet‑Red‑Gold → 4‑7‑×100 ±5% = 4700 Ω (4.7 kΩ).</p>

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

      <hr />

      <h2>Chapter 4 – First Circuits</h2>
      <h3>4.1 Lighting an LED</h3>
      <p><strong>Schematic:</strong></p>
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>{`   +5V
    |
   [R]
    |
   LED (anode)
    |
   GND`}</pre>
      <p>
        Choose R to set current. For a red LED (forward voltage ~2 V) and desired 10 mA:<br />
        R = (5 V – 2 V) / 0.01 A = 300 Ω → use 330 Ω (standard value).
      </p>
      <p><strong>Breadboard layout:</strong></p>
      <ol>
        <li>Connect +5 V to power rail (red).</li>
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
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>{`        V_in
         |
        [R1]
         |
         +---- V_out
         |
        [R2]
         |
        GND`}</pre>
      <p>V_out = V_in * (R2 / (R1 + R2))</p>
      <p>Use two 10 kΩ resistors and 5 V input; V_out = 2.5 V.</p>

      <hr />

      <h2>Chapter 5 – Semiconductor Devices</h2>
      <h3>5.1 BJT as a Switch (NPN)</h3>
      <p>A small base current controls a larger collector current.</p>
      <p><strong>Circuit:</strong></p>
      <ul>
        <li>Base resistor (1 kΩ) to a push‑button to 5 V</li>
        <li>Collector to LED (with resistor) to 5 V</li>
        <li>Emitter to GND</li>
      </ul>
      <p>Pressing the button lights the LED. The transistor saturates (V_CE ≈ 0.2 V).</p>

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
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>{`        R2
   +---/\\/\\/\\---+
   |            |
  Vin o---R1----+---(-) OpAmp --> Vout
                |
               GND`}</pre>
      <p>Gain = –R2 / R1</p>

      <h3>6.3 Non‑Inverting Amplifier</h3>
      <p>Gain = 1 + R2 / R1</p>
      <p>Build a non‑inverting amplifier with gain 2, supply ±12 V, and verify with oscilloscope.</p>

      <h3>6.4 Comparator & Schmitt Trigger</h3>
      <p>Without feedback, the op‑amp saturates high or low depending on which input is higher. Add positive feedback for hysteresis (Schmitt trigger).</p>

      <hr />

      <h2>Chapter 7 – Time‑Dependent Circuits</h2>
      <h3>7.1 RC Charging/Discharging</h3>
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>{`   +5V --- R ---+---- to scope probe
                |
               C
                |
               GND`}</pre>
      <p>Voltage across C: Vc(t) = V (1 – e⁻ᵗ/ᴿᶜ)<br />
      Time constant τ = R × C. After 5τ, the capacitor is ~99% charged.</p>

      <h3>7.2 555 Timer – Astable (Oscillator)</h3>
      <p>Produces a square wave. Frequency set by two resistors and a capacitor.</p>
      <pre style={{ backgroundColor: '#eee', padding: '10px' }}>f = 1.44 / ((R1 + 2R2) × C)</pre>
      <p>Build a 1 Hz LED flasher with R1=1 kΩ, R2=10 kΩ, C=100 µF.</p>
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
        <strong>Analog Input:</strong> <code>analogRead(A0)</code> returns 0‑1023 (0‑5 V).
      </p>

      <h3>9.2 PWM and Servo Control</h3>
      <p>PWM (Pulse Width Modulation) dims LEDs or controls motor speed. A servo motor is positioned by sending a 50 Hz signal with pulse width between 1 ms and 2 ms.</p>

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
        *This textbook is integrated into the Virtual Electronics Lab simulation. All circuits can be assembled by dragging components onto the breadboard. Open the “Textbook” panel to view this content while working.*
      </p>
    </div>
  );
};

export default Textbook;
