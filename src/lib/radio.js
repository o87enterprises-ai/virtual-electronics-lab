// A single-layer air coil: L ≈ 0.004 µH × turns² (5 turns ≈ 0.1 µH).
export const coilMicroHenry = (turns) => 0.004 * turns * turns;

// Resonant frequency of an LC tank, f = 1 / (2π√(LC)), in MHz.
export const resonantMHz = (pF, uH) => 1 / (2 * Math.PI * Math.sqrt(pF * 1e-12 * uH * 1e-6)) / 1e6;

// The capacitance that tunes the tank to `mhz`, in pF.
export const tankPicoFarad = (mhz, uH) => 1e12 / ((2 * Math.PI * mhz * 1e6) ** 2 * uH * 1e-6);
