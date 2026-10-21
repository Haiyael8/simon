export type ColorId = 'green' | 'red' | 'yellow' | 'blue';

export type ColorDef = {
  id: ColorId;
  label: string;
  hex: string;
  // Fixed spatial position on the board; not mirrored in RTL (ADR-1)
  gridArea: string;
};

export const COLORS: ColorDef[] = [
  { id: 'green', label: 'ירוק', hex: '#00D26A', gridArea: '1 / 1' },
  { id: 'red', label: 'אדום', hex: '#FF3B30', gridArea: '1 / 2' },
  { id: 'yellow', label: 'צהוב', hex: '#FFD600', gridArea: '2 / 1' },
  { id: 'blue', label: 'כחול', hex: '#00A3FF', gridArea: '2 / 2' },
];
