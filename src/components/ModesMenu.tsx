import React from 'react';

interface ModesMenuProps {
  navigateTo: (view: 'main' | 'music' | 'modes' | 'game') => void;
  onModeSelect: (mode: number) => void;
}

const ModesMenu: React.FC<ModesMenuProps> = ({ navigateTo, onModeSelect }) => {
  const handleModeClick = (mode: number) => {
    onModeSelect(mode);
    navigateTo('game');
  };

  return (
    <div className="container modes-menu">
      <div className="header">
        <div className="title">ТЕТРИС</div>
      </div>
      
      <div className="button" id="button1" onClick={() => handleModeClick(1)}>
        <div className="button-text">ОБЫЧНЫЙ РЕЖИМ</div>
      </div>
      
      <div className="button" id="button2" onClick={() => handleModeClick(2)}>
        <div className="button-text">БЕСКОНЕЧНЫЙ РЕЖИМ</div>
      </div>
      
      <div className="button" id="button3" onClick={() => handleModeClick(3)}>
        <div className="button-text">40 ЛИНИЙ</div>
      </div>
      
      <div className="button" id="button4" onClick={() => handleModeClick(4)}>
        <div className="button-text">8 X 8</div>
      </div>
      
      <div className="button" id="button5" onClick={() => handleModeClick(5)}>
        <div className="button-text">2 МИНУТЫ</div>
      </div>

      <button id="back-btn2" className="control-button" onClick={() => navigateTo('main')}>
        <div className="back-text">НАЗАД</div>
      </button>
    </div>   
  );
};

export default ModesMenu;