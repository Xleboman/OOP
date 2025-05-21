import React, { useState, useEffect } from 'react';
import '../styles/index.css';

export const BackgroundController = () => {  // Состояние уровня затемнения, 0-100
  const [dimLevel, setDimLevel] = useState(0);

  useEffect(() => { // Эффект для применения затемнения к фону
    const appContainer = document.querySelector('.app-container') as HTMLElement;
    if (appContainer) {
      appContainer.style.setProperty('--dim-opacity', `${dimLevel / 100}`);   
    }
  }, [dimLevel]);

  //Ползунок для регулировки уровня затемнения + отображение текущего значения 
  return (
    <div className="dim-control-container">
      <input
        type="range"
        min="0"
        max="100"
        value={dimLevel}
        onChange={(e) => setDimLevel(parseInt(e.target.value))}
        className="dim-slider"
        aria-label="Уровень затемнения фона"
      />
      <span className="dim-value">{dimLevel}%</span>
    </div>
  );
};