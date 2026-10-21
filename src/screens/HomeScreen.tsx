import { Board } from '../components/Board';
import './home.css';

export function HomeScreen() {
  return (
    <main className="screen home">
      <h1 className="screen-title">סיימון</h1>
      <h2 className="home__stage">שלב 1 מתוך 10</h2>
      <Board />
      <div className="home__action">
        <button type="button" className="btn-primary">
          התחל משחק
        </button>
      </div>
    </main>
  );
}
