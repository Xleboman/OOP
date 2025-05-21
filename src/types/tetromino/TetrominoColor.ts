import { TetrominoType } from "./TetrominoType";
import { TETROMINO_COLORS } from "../../constants/tetromino";

// Тип, разрешающий использовать только указанные цвета тетрамино.
export type TetrominoColor = typeof TETROMINO_COLORS[TetrominoType];