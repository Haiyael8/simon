import { useEffect, useRef } from 'react';
import './overlay.css';
import './dialog.css';

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="overlay">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-text"
      >
        <h2 id="dialog-title" className="dialog__title">
          למחוק את ההיסטוריה?
        </h2>
        <p id="dialog-text" className="dialog__text">
          כל תוצאות המשחקים יימחקו
        </p>
        <div className="dialog__actions">
          <button
            ref={cancelRef}
            type="button"
            className="dialog__btn dialog__btn--cancel"
            onClick={onCancel}
          >
            ביטול
          </button>
          <button
            type="button"
            className="dialog__btn dialog__btn--delete"
            onClick={onConfirm}
          >
            מחק
          </button>
        </div>
      </div>
    </div>
  );
}
