import React, { useState, useCallback, useMemo } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaVolumeUp, FaTimes } from 'react-icons/fa';
import { useTetrisGame } from '../hooks/useTetrisGame';
import { GameField } from './GameField';
import { NextPieceWindow } from './NextPieceWindow';
import { 
  GAME_MODE_INFINITE, 
  GAME_MODE_LINE_LIMIT, 
  GAME_MODE_REGULAR, 
  GAME_MODE_SETTINGS, 
  GAME_MODE_TIME_LIMIT, 
  GAME_MODE_TINY_FIELD, 
  GameModeId
} from '../constants/game';

interface GameScreenProps {
  navigateTo: (view: 'main' | 'music' | 'modes' | 'game') => void;
  selectedMode: number;
}

// Определение выбранного режима игры
const GameScreen: React.FC<GameScreenProps> = ({ navigateTo, selectedMode }) => {
  const chosenGameMode: GameModeId = useMemo(() => {
    if(selectedMode === 1) { // Обычный
      return GAME_MODE_REGULAR;
    } else if (selectedMode === 2) { // Бескоенчый
      return GAME_MODE_INFINITE;
    } else if (selectedMode === 3) {  // 40 линий
      return GAME_MODE_LINE_LIMIT;
    } else if (selectedMode === 4) { // 8х8
      return GAME_MODE_TINY_FIELD;
    } else if (selectedMode === 5) { // 2 минуты
      return GAME_MODE_TIME_LIMIT;
    }

    return GAME_MODE_REGULAR;
  }, [selectedMode]);

   // Получение настроек текущего режима игры
  const {
    inGameTitle: gameModeAltTitle,
    limits: gameModeLimits
  } = GAME_MODE_SETTINGS[chosenGameMode];

  // Состояния для управления музыкальной панелью
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [localVolume, setLocalVolume] = useState(0.7);

  // Хук управления игрой (Tetris)
  const {
    grid, nextPiece, tetromino, isOver, timeActive,
    score, linesCleared, displayedTime, hasTimeLimit,
    lineLimit, hasLineLimit,
    isGameLoopOnHold, toggleGameLoopSuspension,
    restartGame, submitScore,
  } = useTetrisGame(chosenGameMode);

  const beginPlaying = useCallback(() => {
    restartGame();
  }, [restartGame]);

  // Хук аудиоплеера
  const {
    currentTrackIndex,
    isPlaying,
    playlist,
    currentTime,
    duration,
    togglePlay,
    playNextTrack,
    playPrevTrack,
    setVolume,
    seek
  } = useAudioPlayer();

  // Обработчики событий(громкость, пауза, выходи из игры)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    setVolume(newVolume);
  };

  const handlePause = useCallback((event: React.MouseEvent<HTMLButtonElement | HTMLElement>) => {
    const { detail } = event;

    // Управление паузой осуществляется только если кнопка нажата именно мышью
    // Свойство detail хранит количество нажатий мышью на кнопку
    if(detail !== 0) {
      toggleGameLoopSuspension();
    }
  }, [toggleGameLoopSuspension]);

  const handleExit = useCallback(() => {
    if(chosenGameMode === GAME_MODE_INFINITE) {
      submitScore();
    }
    navigateTo('modes');
  }, [navigateTo, submitScore, chosenGameMode]);

    // Функции для форматирования MM:SS для музыки
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTimeString = useCallback((milliseconds: number = 0, isCountdown: boolean = false): string => {
    // Дополнительно предотвращаем отображение отрицательного времени на слое UI.
    if (milliseconds <= 0)
      return '00:00';

    // Перевод миллисекунд в секунды.
    // Есть ограничение времени - округляем секунды вверх, нет - вниз
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
  }, []);

  const timeString: string = useMemo(() => {
    return getTimeString(displayedTime, hasTimeLimit);
  }, [displayedTime, hasTimeLimit, getTimeString]);

  // Даже если значение linesCleared превысило установленный в режиме лимит, будет отображено
  // значение очищенных линий не больше установленного в режиме лимита, если он есть
  const linesString: string = useMemo(() => {
    return Math.min(linesCleared, lineLimit).toString();
  }, [hasLineLimit, lineLimit, linesCleared]);

  return (
    <div className="container game-screen">
      <div className="header">
        <div className="title">ТЕТРИС</div>
      </div>

      {isOver && (
        <div className="game-over-modal">
          <div className="game-over-content">
            <h2>ИГРА ОКОНЧЕНА</h2>
            <div className="game-over-stats">
              <div className="game-over-stat">
                <span>Режим:</span>
                <span>{gameModeAltTitle}</span>
              </div>
              <div className="game-over-stat">
                <span>Очки:</span>
                {<span>{score}</span>}
              </div>
              <div className="game-over-stat">
                <span>Время:</span>
                <span>{getTimeString(timeActive)}</span>
              </div>
              {(gameModeLimits.lines > 0) && (
                <div className="game-over-stat">
                  <span>Линии:</span>
                  <span>{linesString}</span>
                </div>
              )}
            </div>
            <div className="game-over-buttons">
              <button className="game-over-btn restart-btn" onClick={beginPlaying}>
                Заново
              </button>
              <button className="game-over-btn exit-btn" onClick={handleExit}>
                Выход
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-content">
        <div className="stats-panel">
          <div className="mode-label">{gameModeAltTitle.toUpperCase()}</div>
          {
            (lineLimit > 0) && (
              <>
                <div className="lines-label">ЛИНИИ</div>
                <div className="lines-value">
                  {linesString} / {lineLimit}
                </div>
              </>
            )
          }
          <div className="score-label">ОЧКИ</div>
          <div className="score-value">{ score }</div>
          <div className="time-label">ВРЕМЯ</div>
          <div className="time-value">{ timeString }</div>
        </div>
        
        <GameField
          grid={grid}
          tetromino={tetromino}
          isSmall={chosenGameMode === GAME_MODE_TINY_FIELD}
        />

        <div className="right-panel">
          <div className="next-figure-title">СЛЕДУЮЩАЯ</div>
          <NextPieceWindow
            type={nextPiece}
          />

          <button className="control-btn exit-btn" onClick={handleExit}>
            ВЫХОД
          </button>

          <button className="control-btn music-btn" onClick={() => setShowMusicPanel(!showMusicPanel)}>
            МУЗЫКА
          </button>

          <button className="control-btn pause-btn" onClick={handlePause}>
            {isGameLoopOnHold() ? 'ПРОДОЛЖИТЬ' : 'ПАУЗА'}
          </button>
        </div>

        

        {showMusicPanel && (
          <div className="music-panel">
            <div className="music-panel-header">
              <div className="music-panel-title">МУЗЫКА</div>
              <button className="music-panel-close" onClick={() => setShowMusicPanel(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="music-track-info">
              <div className="music-track-title">{playlist[currentTrackIndex].title}</div>
              <div className="music-track-author">{playlist[currentTrackIndex].author}</div>
            </div>

            <div className="music-progress-container">
              <div className="music-time">{formatTime(currentTime)}</div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="music-progress"
              />
              <div className="music-time">{formatTime(duration)}</div>
            </div>

            <div className="music-controls">
              <button onClick={playPrevTrack} className="music-control-btn">
                <FaStepBackward />
              </button>

              <button onClick={togglePlay} className="music-control-btn play-btn">
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              <button onClick={playNextTrack} className="music-control-btn">
                <FaStepForward />
              </button>
            </div>

            <div className="music-volume-control">
              <FaVolumeUp className="volume-icon" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localVolume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameScreen;
// Прогресс-бар, управление и другие кнопки музыки