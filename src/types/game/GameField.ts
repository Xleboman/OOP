// Параметры, передаваемые в игровое поле.
export interface GameField {
    width?: number;
    height?: number;
    timeLimit?: number;
    lineLimit?: number;

    onOverflow?: () => void;
    onLineClear?: (count: number) => void;
}