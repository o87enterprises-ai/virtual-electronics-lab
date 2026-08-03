export const PITCH = 0.05;          // breadboard hole spacing in world units
export const BOARD_TOP_Y = -0.075;  // top surface of the board

export const BOARD_TYPES = {
  MINI: { name: 'Mini (170 points)', size: [0.5, 0.05, 0.4], color: '#f0f0f0' },
  HALF: { name: 'Half (400 points)', size: [1.0, 0.05, 0.6], color: 'white' },
  FULL: { name: 'Full (830 points)', size: [2.0, 0.05, 0.6], color: 'white' },
};

// Snap a world-space point to the nearest hole, clamped to the board.
export function snapToGrid(point, board) {
  const [width, , depth] = board.size;
  const nx = Math.floor((width / 2 - PITCH / 2) / PITCH);
  const nz = Math.floor((depth / 2 - PITCH / 2) / PITCH);
  const clamp = (v, n) => Math.max(-n, Math.min(n, Math.round(v / PITCH))) * PITCH;
  return [clamp(point.x, nx), clamp(point.z, nz)];
}
