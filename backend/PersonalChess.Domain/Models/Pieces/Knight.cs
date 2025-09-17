using PersonalChess.Domain.Enums;

namespace PersonalChess.Domain.Models.Pieces;

public class Knight : Piece
{
    public override string Type => "Knight";

    public Knight(PieceColor color) : base(color) { }

    public override bool IsValidMove(Position from, Position to, Board board)
    {
        int rankDiff = Math.Abs(to.Rank - from.Rank);
        int fileDiff = Math.Abs(to.File - from.File);

        // Movimento do cavalo: formato de "L"
        bool isValidKnightMove = (rankDiff == 2 && fileDiff == 1) || (rankDiff == 1 && fileDiff == 2);

        // Verificar se a casa de destino está vazia ou tem peça adversária
        return isValidKnightMove &&
               (board.Squares[to.Rank, to.File] == null ||
                board.Squares[to.Rank, to.File].Color != Color);
    }
}