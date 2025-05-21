import React, { useState, useEffect } from 'react';
import { getRecords, Record } from './RecordsManager';

interface RatingMenuProps {
  navigateTo: (view: 'main' | 'music' | 'modes') => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getTimeString = (milliseconds: number = 0, isCountdown: boolean = false): string => {
    // Дополнительно предотвращаем отображение отрицательного времени на слое UI.
    if (milliseconds <= 0)
      return '00:00';

    // Переводим миллисекунды в секунды.
    //У игры есть ограничени по времени - округляем секунды вверх, нет - вниз
    const timeInSeconds: number = milliseconds / 1000;
    const timeInSecondsRounded: number = isCountdown ? Math.ceil(timeInSeconds) : Math.floor(timeInSeconds);
    
    // Разбиваем округлённое время в секундах на количество минут и количество оставшихся секунд.
    const minutes: number = Math.floor(timeInSecondsRounded / 60);
    const seconds: number = timeInSecondsRounded % 60;

    // Переводим полученные количества минут и секунд в формат MM и SS.
    const mm: string = minutes.toString().padStart(2, '0');
    const ss: string = seconds.toString().padStart(2, '0');

    // Возвращаем верно отформатированное время.
    return `${mm}:${ss}`;
  }

const RATING_ITEMS_COUNT = 10;
const MODE_BUTTONS_COUNT = 5;

// Функция для получения читаемого названия режима 
const getModeTitle = (modeId: number): string => {
  switch (modeId) {
    case 1: return 'ОБЫЧНЫЙ РЕЖИМ';
    case 2: return 'БЕСКОНЕЧНЫЙ РЕЖИМ';
    case 3: return 'РЕЖИМ 40 ЛИНИЙ';
    case 4: return 'РЕЖИМ 8×8';
    case 5: return 'РЕЖИМ 2 МИНУТЫ';
    default: return `РЕЖИМ ${modeId}`;
  }
};

const RatingMenu: React.FC<RatingMenuProps> = ({ navigateTo }) => {
  const [activeMode, setActiveMode] = useState<number>(1);
  const [records, setRecords] = useState<Record[]>([]);

  //Когда меняется activeMode, код загружает рекорды для этого режима
  useEffect(() => {
    const modeRecords = getRecords(activeMode);
    setRecords(modeRecords);
  }, [activeMode]);

  //При нажатии на кнопку режима обновляется activeMode, и автоматически подгружаются новые рекорды
  const handleModeChange = (mode: number) => {
    setActiveMode(mode);
  };

  //Генерация строк таблицы рейтинга (место, очки, время)
  const renderRatingItems = () => {
    return Array.from({ length: RATING_ITEMS_COUNT }).map((_, index) => {
      const position = index + 1;
      const record = records[index];
      const score = record?.score ?? 0;
      const time = record ? getTimeString(record.time) : '00:00';

      return (
        <React.Fragment key={`rating-item-${position}`}>
          <div 
            className={`record-position pos-${position}`}
            data-testid={`record-position-${position}`}
          >
            {position}
          </div>
          <div 
            className={`record-score score-${position}`}
            data-testid={`record-score-${position}`}
          >
            {score}
          </div>
          <div 
            className={`record-time time-${position}`}
            data-testid={`record-time-${position}`}
          >
            {time}
          </div>
        </React.Fragment>
      );
    });
  };

  //Создает кнопки для выбора режима
  const renderModeButtons = () => {
    return Array.from({ length: MODE_BUTTONS_COUNT }).map((_, index) => {
      const mode = index + 1;
      return (
        <div
          key={`mode-button-${mode}`}
          className={`page-button ${activeMode === mode ? 'active' : ''}`}
          data-testid={`page-button-${mode}`}
          onClick={() => handleModeChange(mode)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleModeChange(mode)}
        >
          <div className="page-button-text">{mode}</div>
        </div>
      );
    });
  };

  //Линии
  return (
    <div className="container rating-menu" data-testid="rating-menu">
      <div className="rating-wrapper">
        <div className="rating-box">
          <div className="rating-line top-line" />
          <div className="rating-line middle-line" />
          <div className="rating-line bottom-line" />
          
          <div className="rating-label score-label">ОЧКИ</div>
          <div className="rating-label time-label">ВРЕМЯ</div>
          
          <div className="rating-title">
            <span className="mode-title">{getModeTitle(activeMode)}</span>
          </div>
          
          {renderRatingItems()}
        </div>
        
        <div className="rating-mode-switches">
          {renderModeButtons()}
        </div>
      </div>
      
      <button 
        className="back-button"
        onClick={() => navigateTo('main')}
        data-testid="back-button"
      >
        <div className="back-text">НАЗАД</div>
      </button>
    </div>
  );
};

export default RatingMenu;