import { useState } from 'react';
import { NavBar, type ScreenId } from './components/NavBar';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';
import { useGame } from './game/useGame';

export function App() {
  const [screen, setScreen] = useState<ScreenId>('home');
  // Held here so switching screens does not unmount the game (ADR-2)
  const game = useGame();

  const navigate = (next: ScreenId) => {
    if (next === 'about' && screen === 'home') game.leaveGame();
    setScreen(next);
  };

  return (
    <div className="app">
      {screen === 'home' ? <HomeScreen game={game} /> : <AboutScreen />}
      <NavBar screen={screen} onNavigate={navigate} />
    </div>
  );
}
