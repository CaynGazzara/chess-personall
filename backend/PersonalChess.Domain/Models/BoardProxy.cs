using PersonalChess.Domain.Models;
using PersonalChess.Domain.Models.Pieces;

public class BoardProxy : Board
{
    public BoardProxy(Piece[,] squares)
    {
        this.Squares = squares;
    }
}