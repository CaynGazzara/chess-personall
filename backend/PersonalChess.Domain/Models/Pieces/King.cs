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
        if ((rankDiff <= 1 && fileDiff <= 1) &&
            (board.Squares[to.Rank, to.File] == null ||
             board.Squares[to.Rank, to.File].Color != Color))
        {
            // Simular o movimento (inclusive captura)
            var tempBoard = DeepCloneBoard(board.Squares);
            tempBoard[to.Rank, to.File] = tempBoard[from.Rank, from.File];
            tempBoard[from.Rank, from.File] = null;

            // Não pode ir para casa atacada (no tabuleiro simulado!)
            if (IsSquareAttacked(to, Color, tempBoard))
                return false;

            // Verificar se o rei fica em cheque após o movimento (usando tempBoard)
            if (board.IsKingInCheck(Color, tempBoard))
                return false;

            return true;
        }
        return false;
    }

    // Deep clone para tabuleiro
    private Piece[,] DeepCloneBoard(Piece[,] original)
    {
        var clone = new Piece[Board.Size, Board.Size];
        for (int i = 0; i < Board.Size; i++)
        {
            for (int j = 0; j < Board.Size; j++)
            {
                if (original[i, j] != null)
                    clone[i, j] = original[i, j].Clone();
            }
        }
        return clone;
    }

    // Helper para saber se uma casa está atacada por oponente
    private bool IsSquareAttacked(Position pos, PieceColor kingColor, Piece[,] boardState)
    {
        var opponentColor = kingColor == PieceColor.White ? PieceColor.Black : PieceColor.White;
        for (int r = 0; r < Board.Size; r++)
        {
            for (int f = 0; f < Board.Size; f++)
            {
                var piece = boardState[r, f];
                if (piece != null && piece.Color == opponentColor)
                {
                    // Não considere o rei adversário (não pode atacar o rei diretamente)
                    if (piece.Type == "King")
                    {
                        int dr = Math.Abs(pos.Rank - r);
                        int df = Math.Abs(pos.File - f);
                        if (dr <= 1 && df <= 1)
                            return true;
                        continue;
                    }
                    if (piece.IsValidMove(new Position(r, f), pos, new BoardProxy(boardState)))
                        return true;
                }
            }
        }
        return false;
    }

    public override Piece Clone()
    {
        var clone = new King(this.Color);
        clone.HasMoved = this.HasMoved;
        return clone;
    }
}