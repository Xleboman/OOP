import { TetrominoType } from "../tetromino/TetrominoType";

// Одна ячейка игрового поля.
export interface GameCell {
    type: TetrominoType | null
}