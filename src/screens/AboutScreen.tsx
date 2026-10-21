import { useState } from 'react';
import './about.css';
import { HistoryCard } from '../components/HistoryCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { History } from '../history/useHistory';

export function AboutScreen({ history }: { history: History }) {
  const [confirming, setConfirming] = useState(false);
  const { results, loadError, saveError, deleteError } = history;

  return (
    <main className="screen about">
      <h1 className="screen-title">אודות</h1>

      <section className="card about__intro">
        <h2 className="about__heading">על המשחק</h2>
        <p>
          סיימון הוא משחק זיכרון: המשחק מציג רצף צבעים עם צלילים, ואתם
          משחזרים אותו.
        </p>
        <p>זכור את רצף הצבעים שמוצג.</p>
        <p>לחץ על הצבעים באותו סדר.</p>
        <p>נסה להגיע עד שלב 10!</p>
      </section>

      <h2 className="about__heading about__history-title">
        10 המשחקים האחרונים
      </h2>
      {loadError && (
        <p className="about__error" role="alert">
          לא ניתן לטעון את ההיסטוריה
        </p>
      )}
      {saveError && (
        <p className="about__error" role="alert">
          לא ניתן היה לשמור את תוצאת המשחק
        </p>
      )}
      {deleteError && (
        <p className="about__error" role="alert">
          לא ניתן היה למחוק את ההיסטוריה
        </p>
      )}
      {results.length === 0 ? (
        <p className="card about__empty">עדיין אין משחקים שמורים</p>
      ) : (
        <>
          <ul className="about__list">
            {results.map((result) => (
              <HistoryCard key={result.id} result={result} />
            ))}
          </ul>
          <button
            type="button"
            className="about__clear"
            onClick={() => setConfirming(true)}
          >
            מחק היסטוריה
          </button>
        </>
      )}
      {confirming && (
        <ConfirmDialog
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            history.clear();
            setConfirming(false);
          }}
        />
      )}
    </main>
  );
}
