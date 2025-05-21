import { useState, useEffect, useCallback, useRef } from 'react';
import { TetrominoType } from '../types/tetromino/TetrominoType';
import { shuffleArray } from '../utils/array';

const ALL_TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];

export const useTetrominoBag = () => {
  const freshBag = useCallback((): TetrominoType[] => shuffleArray(ALL_TETROMINO_TYPES), []);

  const bagRef = useRef<TetrominoType[]>(freshBag());

  // Просматриваем сумку с тетрамино - получаем первую деталь в очереди,
  // но не вынимаем её из сумки.
  const peek = useCallback((): TetrominoType => {
    return bagRef.current.at(0)!;
  }, []);

  // Вынимаем из сумки с тетрамино следующую фигуру в очереди.
  // Если после этого сумка опустеет, заполняем её наново.
  const grab = useCallback((): TetrominoType => {
    const nextInLine: TetrominoType = bagRef.current.shift()!;

    if(bagRef.current.length === 0) {
      bagRef.current = freshBag();
    }

    return nextInLine;
  }, [freshBag]);

  return {
    peek, grab
  };
};