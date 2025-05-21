import React, { useState, useCallback } from "react";
import { TetrominoMatrix } from "../types/tetromino/TetrominoMatrix";
import { TETROMINO_COLORS, TETROMINO_TILES } from "../constants/tetromino";
import { TetrominoType } from "../types/tetromino/TetrominoType";
import { TetrominoColor } from "../types/tetromino/TetrominoColor";
import { Point2D } from "../types/position/Point2D";

export const NextPieceWindow = ({
    type
}: {
    type: TetrominoType
}) => {
    const matrix: TetrominoMatrix = TETROMINO_TILES[type][0];
    const color: TetrominoColor = TETROMINO_COLORS[type];

    // Определяем, как именно должна быть стилизована текущая ячейка.
    const getCellStyles = useCallback((coordinates: Point2D): React.CSSProperties => {
        const cell = matrix[coordinates.y][coordinates.x];
        const filled = (cell === 1);

        // Если ячейка заполнена, окрашиваем её цветом тетрамино.
        if(filled) {
            return {
                backgroundColor: color,
                border: `${1}px solid #ffffff`,
                boxSizing: 'border-box' as 'border-box',
            } as React.CSSProperties;
        }

        // Если ячейка пуста, её фон прозрачен.
        return {
            backgroundColor: 'transparent',
            border: `${1}px solid #ffffff99`,
            boxSizing: 'border-box' as 'border-box',
        } as React.CSSProperties;
    }, [matrix]);

    return (
        <div className="next-figure-box">
            {type && (
                <div className="next-figure">
                    {matrix.map((row, y) => (
                        <div key={y} className="next-figure-row">
                            {row.map((cell, x) => (
                                <div key={`${x}-${y}`} className="next-figure-cell" style={getCellStyles({x, y})} />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}