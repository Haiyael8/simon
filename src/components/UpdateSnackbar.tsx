import './update.css';

type Props = { onRefresh: () => void };

export function UpdateSnackbar({ onRefresh }: Props) {
  return (
    <div className="update-snackbar" role="status">
      <span>גרסה חדשה זמינה</span>
      <button type="button" className="update-snackbar__button" onClick={onRefresh}>
        רענן
      </button>
    </div>
  );
}
