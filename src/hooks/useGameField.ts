import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameCell } from '../types/game/GameCell';
import { GameGrid } from '../types/game/GameGrid';
import { GameField } from '../types/game/GameField';
import { useTetrominoBag } from './useTetrominoBag';
import { useTetromino } from './useTetromino';
import { TetrominoType } from '../types/tetromino/TetrominoType';
import { Point2D } from '../types/position/Point2D';
import { TETROMINO_TILES, TETROMINO_WALL_KICKS } from '../constants/tetromino';
import { TetrominoRotation } from '../types/tetromino/TetrominoRotation';
import { TetrominoMatrix } from '../types/tetromino/TetrominoMatrix';

export const GRID_CELL_EMPTY_VALUE = null;

export const useGameField = (config: GameField) => {
    const {
        width = 10, height = 20,
        onOverflow, onLineClear
    } = config;

    const { 
        peek: peekTetromino,
        grab: grabTetromino 
    } = useTetrominoBag();

    // Инициализируем начальные тетрамино один раз при монтировании.
    const [initialPieces] = useState(() => {
        // Фигура, которая появляется на поле, забирается из сумки.
        const current: TetrominoType = grabTetromino();
        // Фигура, которая ставится следующей в очередь, просматривается, но не забирается.
        const next: TetrominoType = peekTetromino();

        return { current, next };
    });

    // Вычисляемое положение, в котором изначально появится тетрамино на поле.
    const calculateSpawnPosition = useCallback((type: TetrominoType): Point2D => ({
        x: Math.floor(width / 2) - Math.floor(TETROMINO_TILES[type][0][0].length / 2),
        y: -1
    }), [width]);

    const {
        tetromino, getTetrominoRotationState,
        rotateClockwise, rotateCounterClockwise,
        shiftTetromino, moveUp, moveDown, moveLeft, moveRight,
        replaceTetromino
    } = useTetromino(initialPieces.current, calculateSpawnPosition(initialPieces.current));

    // Мемоизируем пустую игровую сетку, чтобы не тратить ресурсы на её пересоздание.
    const getEmptyGrid = useCallback(() => {
        return Array.from({ length: height }, (): GameCell[] => 
            Array.from({ length: width }, (): GameCell => ({
                type: GRID_CELL_EMPTY_VALUE
            }))
        );
    }, [width, height]);

    const [grid, setGrid] = useState<GameGrid>(getEmptyGrid);
    const [nextPiece, setNextPiece] = useState<TetrominoType>(initialPieces.next);
    const [linesCleared, setLinesCleared] = useState<number>(0);

    // Проверка на пустоту ячейки по заданным координатам.
    const isCellEmpty = useCallback((coordinates: Point2D): boolean => {
        const { x, y } = coordinates;

        // Ячейки, находящиеся правее левой границы, левее правой границы и притом выше 
        // верхней границы поля всегда считаются пустыми.
        if ((x >= 0) && (x < width) && (y < 0)) return true;
        // Иначе- не пустыми
        if (x < 0 || x >= width || y >= height) return false;
        return grid[y][x].type === GRID_CELL_EMPTY_VALUE;
    }, [grid, width, height]);

    const matrixHasCollisions = useCallback((
        matrix: TetrominoMatrix,
        position: Point2D,
        offset: Point2D = { x: 0, y: 0 }
    ): boolean => {
        for (let y = 0; y < matrix.length; y++) {
            const row = matrix[y];
            for (let x = 0; x < row.length; x++) {
                const cell = row[x];

                const location: Point2D = {
                    x: position.x + offset.x + x,
                    y: position.y + offset.y + y
                };

                if(!isCellEmpty(location) && cell === 1) {
                    return true;
                }
            }
        }

        return false;
    }, [isCellEmpty]);

    // Проверка на то, есть ли наложения с уже заполненными ячейками поля.
    const hasCollisions = useCallback((offset: Point2D = { x: 0, y: 0 }): boolean => {
        const { matrix, position } = tetromino;

        return matrixHasCollisions(matrix, position, offset);
    }, [tetromino, matrixHasCollisions]);

    // Проверка на заполненные линии и их очистка, если таковые есть.
    const clearLines = useCallback((checkedGrid: GameGrid): GameGrid => {
        const newGrid: GameGrid = [];
        let lineCount = 0;

        for (const row of checkedGrid) {
            const isFullLine = !row.some(cell => cell.type === GRID_CELL_EMPTY_VALUE);

            if(isFullLine) {
                lineCount++;
            } else {
                newGrid.push(row.slice());
            }
        }

        // Увеличиваем количество очищенных линий.
        setLinesCleared(linesCleared + lineCount);
        
        if(onLineClear)
            onLineClear(lineCount);

        while(lineCount > 0) {
            lineCount--;

            newGrid.unshift(
                Array.from({ length: width }, (): GameCell => ({
                    type: GRID_CELL_EMPTY_VALUE
                }))
            );
        }

        return newGrid;
    }, [isCellEmpty, width, linesCleared, onLineClear]);

    const canMoveLeft = useCallback((): boolean => !hasCollisions({ x: -1, y: 0 }), [hasCollisions]);

    const canMoveRight = useCallback((): boolean => !hasCollisions({ x: 1, y: 0 }), [hasCollisions]);

    const canMoveDown = useCallback((): boolean => !hasCollisions({ x: 0, y: 1 }), [hasCollisions]);

    const canMoveUp = useCallback((): boolean => !hasCollisions({ x: 0, y: -1 }), [hasCollisions]);

    // Получение первого сработавшего отскока от стены, если он необходим.
    const getBestWallKickIndex = useCallback((rotationIndex: TetrominoRotation = 0, isClockwise: boolean = true): number => {
        const { type, position, rotation } = tetromino;
        const rotationMatrix: TetrominoMatrix = getTetrominoRotationState(rotationIndex);

        //отскоковые смещения.
        const kickTests = TETROMINO_WALL_KICKS[type][
            isClockwise
            ? rotation
            : [4,7,6,5][rotation]
        ];
    
        // Первое смещение в каждом массиве - это "без смещения", так что начальный случай учтён.
        for (let i = 0; i < 5; i++) {
            const [xOffset, yOffset] = kickTests[i];
            const testPosition = {
                x: position.x + xOffset,
                y: position.y + yOffset
            };
            
            if (!matrixHasCollisions(rotationMatrix, testPosition)) {
                return i;
            }
        }
        
        return -1;
    }, [tetromino, matrixHasCollisions, getTetrominoRotationState]);

    const canRotateClockwise = useCallback((): boolean => {
        const { rotation } = tetromino;
        const nextRotation: TetrominoRotation = (4 + rotation + 1) % 4 as TetrominoRotation;

        return getBestWallKickIndex(nextRotation, true) !== -1;
    }, [tetromino, getBestWallKickIndex]);

    const canRotateCounterClockwise = useCallback((): boolean => {
        const { rotation } = tetromino;
        const nextRotation: TetrominoRotation = (4 + rotation - 1) % 4 as TetrominoRotation;

        return getBestWallKickIndex(nextRotation, false) !== -1;
    }, [tetromino, getBestWallKickIndex]);

    // Перейти к следующему тетрамино в очереди и продвинуть очередь дальше.
    const spawnNextPiece = useCallback(() => {
        const piece = nextPiece;
        const place = calculateSpawnPosition(nextPiece);
        const matrix = TETROMINO_TILES[piece][0];

        // Обязательно проверить, есть ли место для появления следующего тетрамино.
        if(matrixHasCollisions(matrix, place)) {
            if(onOverflow) {
                onOverflow();
            }
        } else {
            replaceTetromino(piece, place);
            // Следующая фигура забирается из сумки сразу после постановки текущей.
            setNextPiece(grabTetromino());
        }
    }, [nextPiece, calculateSpawnPosition, matrixHasCollisions, replaceTetromino, onOverflow, grabTetromino]);

    // Закрепить текущее тетрамино на игровом поле.
    const lockCurrentPiece = useCallback(() => {
        const { matrix, position, type } = tetromino;
        let newGrid: GameGrid = grid.map(row => [...row]);

        for (let y = 0; y < matrix.length; y++) {
            const row = matrix[y];
            for (let x = 0; x < row.length; x++) {
                const cell = row[x];

                const location: Point2D = {
                    x: position.x + x,
                    y: position.y + y
                };

                if(cell === 1) {
                    newGrid[location.y][location.x].type = type;
                }
            }
        }

        newGrid = clearLines(newGrid);

        setGrid(newGrid);
    }, [grid, tetromino]);

    // Сброс игрового поля.
    const resetGameField = useCallback(() => {
        setGrid(getEmptyGrid());
    }, [getEmptyGrid]);

    const safeMoveUp = useCallback((): boolean => {
        if(canMoveUp()) {
            moveUp();
            return true;
        }

        return false;
    }, [canMoveUp, moveUp]);

    const safeMoveDown = useCallback((): boolean => {
        if(canMoveDown()) {
            moveDown();
            return true;
        }

        return false;
    }, [canMoveDown, moveDown]);

    const safeMoveLeft = useCallback((): boolean => {
        if(canMoveLeft()) {
            moveLeft();
            return true;
        }

        return false;
    }, [canMoveLeft, moveLeft]);

    const safeMoveRight = useCallback((): boolean => {
        if(canMoveRight()) {
            moveRight();
            return true;
        }

        return false;
    }, [canMoveRight, moveRight]);

    const safeRotateClockwise = useCallback((): boolean => {
        const { rotation } = tetromino;
        const nextRotation: TetrominoRotation = (4 + rotation + 1) % 4 as TetrominoRotation;

        if(canRotateClockwise()) {
            rotateClockwise(getBestWallKickIndex(nextRotation, true));
            return true;
        }

        return false;
    }, [tetromino, canRotateClockwise, rotateClockwise, getBestWallKickIndex]);

    const safeRotateCounterClockwise = useCallback((): boolean => {
        const { rotation } = tetromino;
        const nextRotation: TetrominoRotation = (4 + rotation - 1) % 4 as TetrominoRotation;

        if(canRotateCounterClockwise()) {
            rotateCounterClockwise(getBestWallKickIndex(nextRotation, false));
            return true;
        }

        return false;
    }, [tetromino, canRotateCounterClockwise, rotateCounterClockwise, getBestWallKickIndex]);

    const safeHardDrop = useCallback(() => {
        let yOffset = 0;

        while(!hasCollisions({ x: 0, y: yOffset })) {
            // Двигаем вниз, пока можем.
            yOffset++;
        }

        shiftTetromino(0, yOffset-1);
    }, [hasCollisions, shiftTetromino]);

    return {
        grid, nextPiece, linesCleared,
        tetromino, isCellEmpty, 
        resetGameField, clearLines, setLinesCleared,
        lockCurrentPiece, spawnNextPiece,
        safeMoveUp, safeMoveDown, safeMoveLeft, safeMoveRight,
        safeRotateClockwise, safeRotateCounterClockwise,
        safeHardDrop
    };
};