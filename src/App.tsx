import { useEffect, useRef, useState } from 'react';
import { NavBar, type ScreenId } from './components/NavBar';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';
import { useGame } from './game/useGame';
import { useHistory } from './history/useHistory';
import { createResult } from './history/historyStorage';

export function App() {
  const [screen, setScreen] = useState<ScreenId>('home');
  // Held here so switching screens does not unmount the game (ADR-2)
  const game = useGame();
  const history = useHistory();

  // Record each finished game once; the ref guards against Strict Mode double effects (ADR-4)
  const { status, gameId, completedRounds } = game.state;
  const { record } = history;
  const lastRecorded = useRef(0);
  useEffect(() => {
    if (status !== 'won' && status !== 'lost') return;
    if (lastRecorded.current === gameId) return;
    lastRecorded.current = gameId;
    record(createResult(status === 'won' ? 'win' : 'loss', completedRounds));
  }, [status, gameId, completedRounds, record]);

  const navigate = (next: ScreenId) => {
    if (next === 'about' && screen === 'home') game.leaveGame();
    setScreen(next);
  };

  return (
    <div className="app">
      {screen === 'home' ? (
        <HomeScreen game={game} />
      ) : (
        <AboutScreen history={history} />
      )}
      <NavBar screen={screen} onNavigate={navigate} />
    </div>
  );
}
