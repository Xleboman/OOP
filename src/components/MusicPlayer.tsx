import React, { useEffect, useState } from 'react';
import { FaPlay, FaStop, FaVolumeUp } from 'react-icons/fa';
import { useAudioPlayer } from './AudioPlayerContext.tsx';

interface MusicPlayerProps {
  navigateTo: (view: 'main' | 'music' | 'modes') => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ navigateTo }) => {
  const {
    currentTrackIndex,
    isPlaying,
    playlist,
    currentTime,
    duration,
    volume,
    play,
    stop,
    playNextTrack,
    playPrevTrack,
    setVolume,
    seek
  } = useAudioPlayer();

  //Локальное состояние
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [volumeValue, setVolumeValue] = useState(volume);

  //Эффекты для синхронизации состояния
  //При isSeeking = true любое изменение положения бегунка, перематывающего композицию, регистрируется в seekValue
  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(currentTime);
    }
  }, [currentTime, isSeeking]);

  useEffect(() => {
    setVolumeValue(volume);
  }, [volume]);

  //Обработчики событий (взаимодействия с ползунком)
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setSeekValue(time);
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSeekMouseUp = () => {
    seek(seekValue);
    setIsSeeking(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeValue(newVolume);
    setVolume(newVolume);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'ArrowLeft': 
          playPrevTrack(); 
          break;
        case 'ArrowRight': 
          playNextTrack(); 
          break;
        case 'Space': 
          e.preventDefault();
          isPlaying ? stop() : play(); 
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, stop, playNextTrack, playPrevTrack]);

  return (
    <div className="container">
      <div className="header">
        <div className="title">ТЕТРИС</div>
      </div>
      
      <div className="music-label">МУЗЫКА</div>
      
      <div className="music-box">
      <div className="track-info-container">
        <span className="track-title">{playlist[currentTrackIndex]?.title}</span>
        <span className="track-author">{playlist[currentTrackIndex]?.author}</span>
      </div>
        
        {/* Полоска прогресса */}
        <div className="music-progress-container">
          <div className="music-progress-bar" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const newTime = percent * duration;
            seek(newTime);
            setSeekValue(newTime);
          }}>
            <div 
              className="music-progress-fill" 
              style={{ width: `${(seekValue / duration) * 100}%` }}
            >
              <div className="music-progress-handle" />
            </div>
          </div>
          <div className="music-time-display">
            <span>{formatTime(seekValue)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Полоска громкости */}
        <div className="music-volume-container">
          <FaVolumeUp className="music-volume-icon" />
          <div 
            className="music-volume-bar"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              const newVolume = Math.max(0, Math.min(1, percent));
              setVolume(newVolume);
              setVolumeValue(newVolume);
            }}
          >
            <div 
              className="music-volume-fill" 
              style={{ width: `${volumeValue * 100}%` }}
            >
              <div className="music-volume-handle" />
            </div>
          </div>
        </div>
      </div>
      
      <button className="control-button" id="arrow-left" onClick={playPrevTrack}>
        <div className="button-icon">←</div>
      </button>
      
      <button className="control-button" id="arrow-right" onClick={playNextTrack}>
        <div className="button-icon">→</div>
      </button>
      
      <button 
        className="control-button" 
        id="play-btn" 
        onClick={play}
        disabled={isPlaying}
        style={{ 
          /* Контролирует прозрачность от воспроизведения трека */
          opacity: isPlaying ? 0.5 : 1,
          /* Поведение объекта при наведении */
          cursor: isPlaying ? 'not-allowed' : 'pointer'
        }}
      >
        <FaPlay className="button-icon" />
      </button>
      
      <button 
        className="control-button" 
        id="stop-btn" 
        onClick={stop}
        disabled={!isPlaying}
        style={{ 
          opacity: isPlaying ? 1 : 0.5,
          cursor: isPlaying ? 'pointer' : 'not-allowed'
        }}
      >
        <FaStop className="button-icon" />
      </button>
      
      <button className="control-button" id="back-btn" onClick={() => navigateTo('main')}>
        <div className="back-text">НАЗАД</div>
      </button>
    </div>
  );
};

export default MusicPlayer;