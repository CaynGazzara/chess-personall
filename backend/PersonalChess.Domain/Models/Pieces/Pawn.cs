using PersonalChess.Domain.Enums;

namespace PersonalChess.Domain.Models.Pieces;

public class Pawn : Piece
{
    public override string Type => "Pawn";
    public Pawn(PieceColor color) : base(color) { }

    public override bool IsValidMove(Position from, Position to, Board board)
    {
        int direction = Color == PieceColor.White ? 1 : -1;
        int startRow = Color == PieceColor.White ? 1 : 6;

        // Movimento simples para frente
        if (from.File == to.File && to.Rank == from.Rank + direction && board.Squares[to.Rank, to.File] == null)
            return true;

        // Movimento duplo no início
        if (from.File == to.File && from.Rank == startRow &&
            to.Rank == from.Rank + 2 * direction &&
            board.Squares[from.Rank + direction, from.File] == null &&
            board.Squares[to.Rank, to.File] == null)
            return true;

        // Captura
        if (Math.Abs(from.File - to.File) == 1 && to.Rank == from.Rank + direction &&
            board.Squares[to.Rank, to.File] != null && board.Squares[to.Rank, to.File].Color != Color)
            return true;

        return false;
    }

    public override Piece Clone()
    {
        var clone = new Pawn(this.Color);
        clone.HasMoved = this.HasMoved;
        return clone;
    }
}