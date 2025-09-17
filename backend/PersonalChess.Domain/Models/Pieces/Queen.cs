using PersonalChess.Domain.Enums;

namespace PersonalChess.Domain.Models.Pieces;

public class Queen : Piece
{
    public override string Type => "Queen";

    public Queen(PieceColor color) : base(color) { }

    public override bool IsValidMove(Position from, Position to, Board board)
    {
        int rankDiff = to.Rank - from.Rank;
        int fileDiff = to.File - from.File;

        // A rainha move-se como torre + bispo
        bool isDiagonal = Math.Abs(rankDiff) == Math.Abs(fileDiff);
        bool isStraight = rankDiff == 0 || fileDiff == 0;

        if (!isDiagonal && !isStraight)
            return false;

        // Verificar se não há peças no caminho
        int rankStep = Math.Sign(rankDiff);
        int fileStep = Math.Sign(fileDiff);
        int steps = Math.Max(Math.Abs(rankDiff), Math.Abs(fileDiff));

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