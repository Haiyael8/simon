import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import './overlay.css';

type Props = {
  outcome: 'won' | 'lost';
  completedRounds: number;
  onConfirm: () => void;
};

function completedLabel(count: number): string {
  return count === 1 ? 'שלב אחד שהושלם' : `${count} שלבים שהושלמו`;
}

export function EndOverlay({ outcome, completedRounds, onConfirm }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  // Confetti only on a win; cleared when the overlay closes
  useEffect(() => {
    if (outcome !== 'won') return;
    void confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#00D26A', '#FF3B30', '#FFD600', '#00A3FF'],
      disableForReducedMotion: true,
    });
    return () => {
      confetti.reset();
    };
  }, [outcome]);

  return (
    <div className="overlay">
      <div className="overlay__card card" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
        <h2
          id="overlay-title"
          className={`overlay__title overlay__title--${outcome}`}
        >
          {outcome === 'won' ? 'כל הכבוד! ניצחת!' : 'נפסלת!'}
        </h2>
        {outcome === 'lost' && (
          <p className="overlay__detail">{completedLabel(completedRounds)}</p>
        )}
        <button ref={confirmRef} type="button" className="btn-primary" onClick={onConfirm}>
          אישור
        </button>
      </div>
    </div>
  );
}
