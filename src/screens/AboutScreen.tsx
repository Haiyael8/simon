import './about.css';

export function AboutScreen() {
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
      <p className="card about__empty">עדיין אין משחקים שמורים</p>
    </main>
  );
}
