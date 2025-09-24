using PersonalChess.Domain.Enums;

namespace PersonalChess.Domain.Models;

public abstract class Piece
{
    public PieceColor Color { get; set; }
    public bool HasMoved { get; set; } = false;
    public abstract string Type { get; }

    protected Piece(PieceColor color)
    {
        Color = color;
    }

    public abstract bool IsValidMove(Position from, Position to, Board board);
    public abstract Piece Clone();
}