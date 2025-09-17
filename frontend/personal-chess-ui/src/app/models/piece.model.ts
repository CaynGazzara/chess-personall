import { PieceColor } from './enums/piece-color.enum';

export interface Piece {
  type: string;
  color: PieceColor;
  hasMoved: boolean;
}