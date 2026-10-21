import type { CSSProperties } from 'react';
import { COLORS } from '../game/colors';
import './board.css';

export function Board() {
  return (
    <div className="board">
      {COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className={`board__quadrant board__quadrant--${color.id}`}
          aria-label={color.label}
          style={
            {
              gridArea: color.gridArea,
              '--quadrant-color': color.hex,
            } as CSSProperties
          }
        />
      ))}
      <div className="board__center" aria-hidden="true" />
    </div>
  );
}
