using PersonalChess.Domain.Enums;

namespace PersonalChess.Domain.Models.Pieces;

public class Bishop : Piece
{
    public override string Type => "Bishop";

    public Bishop(PieceColor color) : base(color) { }

    public override bool IsValidMove(Position from, Position to, Board board)
    {
        int rankDiff = to.Rank - from.Rank;
        int fileDiff = to.File - from.File;

        // O bispo move-se apenas na diagonal
        if (Math.Abs(rankDiff) != Math.Abs(fileDiff))
            return false;

        // Verificar se não há peças no caminho
        int rankStep = Math.Sign(rankDiff);
        int fileStep = Math.Sign(fileDiff);
        int steps = Math.Abs(rankDiff);

        for (int i = 1; i < steps; i++)
        {
            int checkRank = from.Rank + i * rankStep;
            int checkFile = from.File + i * fileStep;

            if (board.Squares[checkRank, checkFile] != null)
                return false;
        }

        // Verificar se a casa de destino está vazia ou tem peça adversária
        return board.Squares[to.Rank, to.File] == null ||
               board.Squares[to.Rank, to.File].Color != Color;
    }
}