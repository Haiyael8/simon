import { COLORS, type ColorId } from './colors';

// Game-only randomness; replaced in tests
export function randomColor(): ColorId {
  return COLORS[Math.floor(Math.random() * COLORS.length)].id;
}
