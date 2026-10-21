import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { COLORS, type ColorId } from '../game/colors';
import './board.css';

type Props = {
  litColor: ColorId | null;
  interactive: boolean;
  // Dim all quadrants except the lit one (sequence playback)
  dimmed: boolean;
  onPressStart: (color: ColorId) => void;
  onPressEnd: () => void;
};

export function Board({ litColor, interactive, dimmed, onPressStart, onPressEnd }: Props) {
  // Only one pointer may press at a time; extra touches and drags are ignored
  const activePointer = useRef<number | null>(null);
  const onPressEndRef = useRef(onPressEnd);
  useEffect(() => {
    onPressEndRef.current = onPressEnd;
  }, [onPressEnd]);

  // The quadrant can become disabled before release, so listen on window
  useEffect(() => {
    const release = (event: globalThis.PointerEvent) => {
      if (activePointer.current === null || event.pointerId !== activePointer.current) return;
      activePointer.current = null;
      onPressEndRef.current();
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, []);

  const handlePointerDown = (event: PointerEvent, color: ColorId) => {
    if (!interactive || activePointer.current !== null) return;
    activePointer.current = event.pointerId;
    onPressStart(color);
  };

  const handleKeyDown = (event: KeyboardEvent, color: ColorId) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (event.repeat || !interactive || activePointer.current !== null) return;
    onPressStart(color);
    onPressEnd();
  };

  return (
    <div className={`board${dimmed ? ' board--dimmed' : ''}`}>
      {COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className={`board__quadrant board__quadrant--${color.id}${
            litColor === color.id ? ' board__quadrant--lit' : ''
          }`}
          aria-label={color.label}
          disabled={!interactive}
          onPointerDown={(event) => handlePointerDown(event, color.id)}
          onKeyDown={(event) => handleKeyDown(event, color.id)}
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
