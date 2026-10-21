import { useEffect, useRef, useState } from 'react';
import { NavBar, type ScreenId } from './components/NavBar';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';
import { useGame } from './game/useGame';
import { useHistory } from './history/useHistory';
import { createResult } from './history/historyStorage';
import { useUpdatePrompt } from './pwa/useUpdatePrompt';
import { UpdateSnackbar } from './components/UpdateSnackbar';

export function App() {
  const [screen, setScreen] = useState<ScreenId>('home');
  // Held here so switching screens does not unmount the game (ADR-2)
  const game = useGame();
  const history = useHistory();
  const { needRefresh, refresh } = useUpdatePrompt();

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
      {needRefresh && status !== 'presenting' && status !== 'awaitingInput' && status !== 'paused' && (
        <UpdateSnackbar onRefresh={refresh} />
      )}
      <NavBar screen={screen} onNavigate={navigate} />
    </div>
  );
}
