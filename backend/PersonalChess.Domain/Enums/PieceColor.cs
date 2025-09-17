namespace PersonalChess.Domain.Enums;

public enum PieceColor
{
    White,
    Black
}

// Adicione método de extensão para converter para string
public static class PieceColorExtensions
{
    public static string ToString(this PieceColor pieceColor)
    {
        return pieceColor switch
        {
            PieceColor.White => "White",
            PieceColor.Black => "Black",
            _ => "Unknown"
        };
    }
}