import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tetromino } from '../types/tetromino/Tetromino';
import { TetrominoType } from '../types/tetromino/TetrominoType';
import { TetrominoMatrix } from '../types/tetromino/TetrominoMatrix';
import { Point2D } from '../types/position/Point2D';
import { TetrominoRotation } from '../types/tetromino/TetrominoRotation';
import { TetrominoColor } from '../types/tetromino/TetrominoColor';
import { TETROMINO_COLORS, TETROMINO_TILES, TETROMINO_WALL_KICKS } from '../constants/tetromino';

const TETROMINO_DEFAULT_POSITION: Point2D = { x: 0, y: 0 };

export const useTetromino = (
    initialType: TetrominoType,
    initialPosition: Point2D = TETROMINO_DEFAULT_POSITION,
    initialRotation: TetrominoRotation = 0
) => {
    const [type, setType] = useState<TetrominoType>(initialType);
    const [position, setPosition] = useState<Point2D>(initialPosition);
    const [rotation, setRotation] = useState<TetrominoRotation>(initialRotation);

    // Эти значения будут обновляться автоматически, когда обновится значение type или rotation.
    const matrix: TetrominoMatrix = TETROMINO_TILES[type][rotation];
    const color: TetrominoColor = TETROMINO_COLORS[type];
    const kicksCW = TETROMINO_WALL_KICKS[type][rotation];
    const kicksCCW = TETROMINO_WALL_KICKS[type][[4,7,6,5][rotation]];

    const tetromino = useMemo((): Tetromino => (
        { type, matrix, position, rotation, color }
    ), [type, matrix, position, rotation, color]);

    // Изменяет положение тетрамино в пространстве, смещая на dx по горизонтали и на dy по вертикали.
    const shiftTetromino = useCallback((dx: number = 0, dy: number = 0) => {
        setPosition(currentPosition => {
            return {
                x: currentPosition.x + dx,
                y: currentPosition.y + dy
            };
        });
    }, []);

    const getTetrominoRotationState = useCallback((index: TetrominoRotation): TetrominoMatrix => {
        return TETROMINO_TILES[type][index];
    }, [type]);

    // Поворачивает тетрамино по часовой стрелке.
    const rotateClockwise = useCallback((kickIndex: number = 0) => {
        // Отпинываем фигуру в пространстве по заданному отскоку при повороте.
        setPosition(currentPosition => {
            const [xKick, yKick] = kicksCW[kickIndex];

            return {
                x: currentPosition.x + xKick,
                y: currentPosition.y + yKick
            };
        });

        setRotation(currentRotation => {
            return (currentRotation === 3) ? 0 : (currentRotation + 1) as TetrominoRotation
        });
    }, [kicksCW]);

    // Поворачивает тетрамино против часовой стрелки.
    const rotateCounterClockwise = useCallback((kickIndex: number = 0) => {
        // Отпинываем фигуру в пространстве по заданному отскоку при повороте.
        setPosition(currentPosition => {
            const [xKick, yKick] = kicksCCW[kickIndex];

            return {
                x: currentPosition.x + xKick,
                y: currentPosition.y + yKick
            };
        });

        setRotation(currentRotation => {
            return (currentRotation === 0) ? 3 : (currentRotation - 1) as TetrominoRotation
        });
    }, [kicksCCW]);

    const moveUp = useCallback(() => {
        shiftTetromino(0, -1);
    }, []);

    const moveDown = useCallback(() => {
        shiftTetromino(0, 1);
    }, []);

    const moveLeft = useCallback(() => {
        shiftTetromino(-1, 0);
    }, []);

    const moveRight = useCallback(() => {
        shiftTetromino(1, 0);
    }, []);

    // Заменяет тетрамино на новое.
    const replaceTetromino = useCallback((
        type: TetrominoType,
        position: Point2D = TETROMINO_DEFAULT_POSITION,
        rotation: TetrominoRotation = 0
    ) => {
        setType(type);
        setPosition(position);
        setRotation(rotation);
    }, []);

    return {
        tetromino, getTetrominoRotationState,
        rotateClockwise, rotateCounterClockwise,
        shiftTetromino, moveUp, moveDown, moveLeft, moveRight,
        replaceTetromino
    };
};