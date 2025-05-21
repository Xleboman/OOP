import React, { useCallback } from "react";
import { GameGrid } from "../types/game/GameGrid";
import { Tetromino } from "../types/tetromino/Tetromino";
import { Point2D } from "../types/position/Point2D";
import { GRID_CELL_EMPTY_VALUE } from "../hooks/useGameField";
import { TETROMINO_COLORS } from "../constants/tetromino";

interface GameFieldProps {
    grid: GameGrid;
    tetromino: Tetromino;
    isSmall?: boolean;
}

const BORDER_COLOR = '#ffffff';
const OUTER_BORDER_WIDTH = 1;
const INNER_BORDER_WIDTH = 2;

export const GameField: React.FC<GameFieldProps> = ({
    grid, tetromino, isSmall = false
}) => {
    const isTetrominoPixel = useCallback((coordinates: Point2D): boolean => {
        const { matrix, position } = tetromino;
        const matrixRows: number = matrix.length,
              matrixCols: number = matrix[0].length;

        // Вычисляем границы матрицы тетрамино
        const xMin: number = position.x,
              xMax: number = xMin + matrixCols,
              yMin: number = position.y,
              yMax: number = yMin + matrixRows;

        // Проверяем, попадают ли переданные координаты в область активного тетрамино
        const isInTetrominoBounds = (
            (coordinates.x >= xMin) && (coordinates.x < xMax)
            &&
            (coordinates.y >= yMin) && (coordinates.y < yMax)
        );

        if(isInTetrominoBounds) {
            const cellX: number = coordinates.x - xMin,
                  cellY: number = coordinates.y - yMin,
                  cell: number  = matrix[cellY][cellX];

            // Если соответствующая ячейка матрицы "закрашена", тогда в ней лежит
            // активный пиксель активного тетрамино
            return cell === 1;
        }

        // Если переданные координаты не попадают в эту область, то они точно не принадлежат тетрамино
        return false;
    }, [tetromino]);

    // Определяем, как именно должна быть стилизована текущая ячейка
    const getCellStyles = useCallback((coordinates: Point2D): React.CSSProperties => {
        const styleAsActiveTetromino = isTetrominoPixel(coordinates);
        const cell = grid[coordinates.y][coordinates.x].type;

        // Если требуется стилизовать ячейку как активное тетрамино, делаем это
        if(styleAsActiveTetromino) {
            return {
                backgroundColor: tetromino.color,
                border: `${OUTER_BORDER_WIDTH}px solid ${BORDER_COLOR}`,
                boxSizing: 'border-box' as 'border-box',
            } as React.CSSProperties;
        }

        // Если ячейка не принадлежит активному тетрамино и пуста, ничего не стилизуем
        if (cell === GRID_CELL_EMPTY_VALUE) return {} as React.CSSProperties;

        // Если ячейка не принадлежит активному тетрамино и заполнена, стилизуем её по правилам сетки
        return {
            backgroundColor: TETROMINO_COLORS[cell],
            border: `${OUTER_BORDER_WIDTH}px solid ${BORDER_COLOR}`,
            boxSizing: 'border-box' as 'border-box',
        } as React.CSSProperties;
    }, [tetromino, isTetrominoPixel]);

    return (
        <div className={['game-field-container', isSmall && 'small-field'].filter(Boolean).join(' ')}>
            <div className="game-field">
                {grid.map((row, y) => (
                    <div key={y} className="game-row">
                        {/* Если ячейка содержит активный пиксел тетрамино, отрисовываем его. 
                        В противном случае будет отрисовано содержимое ячейки из grid */}
                        {row.map((cell, x) => (
                            <div key={`${x}-${y}`} className="game-cell" style={getCellStyles({x, y})} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}