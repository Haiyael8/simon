import { useState } from 'react';
import { NavBar, type ScreenId } from './components/NavBar';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';

export function App() {
  const [screen, setScreen] = useState<ScreenId>('home');

  return (
    <div className="app">
      {screen === 'home' ? <HomeScreen /> : <AboutScreen />}
      <NavBar screen={screen} onNavigate={setScreen} />
    </div>
  );
}
