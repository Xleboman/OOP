import React from 'react';

interface MainMenuProps {
  navigateTo: (view: 'main' | 'music' | 'modes' | 'rating') => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ navigateTo }) => {
  return (
    <div className="container main-menu">
      <div className="header">
        <div className="title">ТЕТРИС</div>
      </div>
      
      <div className="button" id="button1" onClick={() => navigateTo('modes')}>
        <div className="button-text">РЕЖИМЫ</div>
      </div>
      
      <div className="button" id="button2" onClick={() => navigateTo('rating')}>
        <div className="button-text">РЕЙТИНГ</div>
      </div>
      
      <div className="button" id="button3" onClick={() => navigateTo('music')}>
        <div className="button-text">МУЗЫКА</div>
      </div>
    </div>
  );
};

export default MainMenu;