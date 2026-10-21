import type { GameResult } from '../history/historyStorage';

function completedLabel(count: number): string {
  if (count === 1) return 'שלב אחד שהושלם';
  return `${count} שלבים שהושלמו`;
}

export function HistoryCard({ result }: { result: GameResult }) {
  const won = result.outcome === 'win';
  return (
    <li className="history-card card">
      <div className="history-card__main">
        <span className="history-card__rounds">
          {completedLabel(result.completedRounds)}
        </span>
        <span
          className={`history-card__outcome history-card__outcome--${won ? 'win' : 'loss'}`}
        >
          {won ? 'ניצחון' : 'הפסד'}
        </span>
      </div>
      <time className="history-card__time" dateTime={result.finishedAt}>
        {new Date(result.finishedAt).toLocaleString('he-IL', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}
      </time>
    </li>
  );
}
