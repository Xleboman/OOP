import { TetrominoType } from './TetrominoType';
import { TetrominoMatrix } from './TetrominoMatrix';
import { TetrominoRotation } from './TetrominoRotation';
import { TetrominoColor } from './TetrominoColor';
import { Point2D } from '../position/Point2D';

export interface Tetromino {
  type: TetrominoType;
  matrix: TetrominoMatrix;
  position: Point2D;
  rotation: TetrominoRotation;
  color: TetrominoColor;
}