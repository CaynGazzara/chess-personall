using PersonalChess.Domain.Enums;

namespace PersonalChess.Domain.Models.Pieces;

public class King : Piece
{
    public override string Type => "King";

    public King(PieceColor color) : base(color) { }

    public override bool IsValidMove(Position from, Position to, Board board)
    {
        int rankDiff = Math.Abs(to.Rank - from.Rank);
        int fileDiff = Math.Abs(to.File - from.File);

        // Movimento do rei: apenas uma casa em qualquer direção
        return (rankDiff <= 1 && fileDiff <= 1) &&
               (board.Squares[to.Rank, to.File] == null ||
                board.Squares[to.Rank, to.File].Color != Color);
    }
}