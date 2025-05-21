import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';

interface Song {
  title: string;
  author: string;
  audioUrl: string;
}

interface AudioPlayerContextType {
  currentTrackIndex: number;
  isPlaying: boolean;
  playlist: Song[];
  currentTime: number;
  duration: number;
  volume: number;
  play: () => void;
  stop: () => void;
  togglePlay: () => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  setCurrentTrack: (index: number) => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const playlist: Song[] = [
    { 
      title: "Fears Kill", 
      author: "Unknown Artist",
      audioUrl: "/media/songs/faerskill.mp3"
    },
    { 
      title: "I'll Do It", 
      author: "Unknown Artist",
      audioUrl: "/media/songs/I'll Do It.mp3" 
    },
    { 
      title: "Limerence", 
      author: "Unknown Artist",
      audioUrl: "/media/songs/Limerence.mp3"
    },
    { 
      title: "Nightcore", 
      author: "Unknown Artist",
      audioUrl: "/media/songs/Nightcore.mp3"
    },
    { 
      title: "Polozheniye", 
      author: "Unknown Artist",
      audioUrl: "/media/songs/Polozheniye.mp3"
    },
    { 
      title: "The Beach", 
      author: "Unknown Artist",
      audioUrl: "/media/songs/the beach.mp3"
    }
  ];

  // Состояния плеера
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Инициализация аудио
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = 'auto';
    audio.volume = volume;
  
     // Обработчики событий аудио
    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', playNextTrack);
  
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', playNextTrack);
      audio.pause();
    };
  }, []);

  // Обновление источника при изменении трека
  useEffect(() => {
    if (!audioRef.current) return;
  
    const audio = audioRef.current;
    const wasPlaying = isPlaying;
    
    audio.pause();
    audio.src = playlist[currentTrackIndex].audioUrl;
    
    if (wasPlaying) {
      audio.play().catch(e => console.error("Play error:", e));
    }
  }, [currentTrackIndex]);

  // Запуск воспроизведения
  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback error:", error);
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    isPlaying ? stop() : play();
  }, [isPlaying, play, stop]);

  const playNextTrack = useCallback(() => {
    setCurrentTrackIndex(prev => (prev + 1) % playlist.length);
  }, [playlist.length]);

  // Прошлая композиция относительно текущей + 
  // Переходит в конец плейлиста, если текущая композиция находится в его начале.
  const playPrevTrack = useCallback(() => {
    setCurrentTrackIndex(prev => (prev - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  // Изменяет текущую композицию на композицию, стоящую на месте index в плейлисте
  // Проверяет, что такой индекс существует 
  const setCurrentTrack = useCallback((index: number) => {
    if (index >= 0 && index < playlist.length) {
      setCurrentTrackIndex(index);
    }
  }, [playlist.length]);

  // Изменяет громкость на заданное значение от 0 до 1. 
  // Если указано значение вне диапазона, вгоняется в этот диапазон.
  const setVolume = useCallback((newVolume: number) => {
    const volumeValue = Math.max(0, Math.min(1, newVolume));
    setVolumeState(volumeValue);
    if (audioRef.current) {
      audioRef.current.volume = volumeValue;
    }
  }, []);

   // Перемотка трека
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      currentTrackIndex,
      isPlaying,
      playlist,
      currentTime,
      duration,
      volume,
      play,
      stop,
      togglePlay,
      playNextTrack,
      playPrevTrack,
      setCurrentTrack,
      setVolume,
      seek
    }}>
      {children}
    </AudioPlayerContext.Provider>   // Предоставление контекста дочерним компонентам
  );
};


// Хук для доступа к контексту аудиоплеера
export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};