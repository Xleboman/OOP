import React, { useEffect, useState } from 'react';
import MainMenu from './MainMenu';
import MusicPlayer from './MusicPlayer';
import ModesMenu from './ModesMenu';
import RatingMenu from './RatingMenu';
import GameScreen from './GameScreen';
import { AudioPlayerProvider } from './AudioPlayerContext';
import { BackgroundController } from './Background';

type View = 'main' | 'music' | 'modes' | 'rating' | 'game';

const App = () => {
  const [currentView, setCurrentView] = useState<View>('main');
  const [selectedMode, setSelectedMode] = useState<number>(1);

  const navigateTo = (view: View) => {
    setCurrentView(view);
  };

  const handleModeSelect = (mode: number) => {
    setSelectedMode(mode);
    navigateTo('game');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'main': return <MainMenu navigateTo={navigateTo} />;
      case 'music': return <MusicPlayer navigateTo={navigateTo} />;
      case 'modes': return <ModesMenu navigateTo={navigateTo} onModeSelect={handleModeSelect} />;
      case 'rating': return <RatingMenu navigateTo={navigateTo} />;
      case 'game': return <GameScreen navigateTo={navigateTo} selectedMode={selectedMode} />;
      default: return <MainMenu navigateTo={navigateTo} />;
    }
  };

  return (
    <AudioPlayerProvider>
      <div className="app-container">
        {renderCurrentView()}
        <BackgroundController />
      </div>
    </AudioPlayerProvider>
  );
};

export default App;