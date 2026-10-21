import { Board } from '../components/Board';
import { EndOverlay } from '../components/EndOverlay';
import type { useGame } from '../game/useGame';
import './home.css';

type Props = {
  game: ReturnType<typeof useGame>;
};

export function HomeScreen({ game }: Props) {
  const { state, litColor, resultVisible, audioError } = game;
  const { status } = state;

  // Before a game starts the board shows stage 1
  const stage = status === 'idle' ? 1 : state.round;
  const ended = status === 'won' || status === 'lost';

  return (
    <main className="screen home">
      <h1 className="screen-title">סיימון</h1>
      <h2 className="home__stage">שלב {stage} מתוך 10</h2>
      <Board
        litColor={litColor}
        interactive={status === 'awaitingInput'}
        dimmed={status === 'presenting'}
        onPressStart={game.pressStart}
        onPressEnd={game.pressEnd}
      />
      <div className="home__status" aria-live="polite">
        {status === 'presenting' && <p>המשחק מציג את הרצף</p>}
        {status === 'awaitingInput' && (
          <>
            <p>התור שלך</p>
            <p className="home__hint">הקש על הצבעים לפי הסדר</p>
          </>
        )}
      </div>
      <div className="home__action">
        {status === 'idle' && (
          <>
            <button type="button" className="btn-primary btn-primary--purple"
              onClick={() => void game.startGame()}
            >
              התחל משחק
            </button>
            {audioError && (
              <p className="home__error" role="alert">
                לא הצלחנו להפעיל צליל. נסו שוב.
              </p>
            )}
          </>
        )}
      </div>
      {ended && resultVisible && (
        <EndOverlay
          outcome={status}
          completedRounds={state.completedRounds}
          onConfirm={game.dismiss}
        />
      )}
    </main>
  );
}
