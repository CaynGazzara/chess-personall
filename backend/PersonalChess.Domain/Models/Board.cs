using PersonalChess.Domain.Enums;
using PersonalChess.Domain.Models.Pieces;

namespace PersonalChess.Domain.Models;

public class Board
{
    public const int Size = 8;
    public Piece[,] Squares { get; set; }
    public PieceColor CurrentPlayer { get; set; } = PieceColor.White;
    public GameState GameState { get; set; } = GameState.NotStarted;

    public Board()
    {
        Squares = new Piece[Size, Size];
        InitializeBoard();
        GameState = GameState.InProgress;
    }

    private void InitializeBoard()
    {
        // Peças brancas
        Squares[0, 0] = new Rook(PieceColor.White);
        Squares[0, 1] = new Knight(PieceColor.White);
        Squares[0, 2] = new Bishop(PieceColor.White);
        Squares[0, 3] = new Queen(PieceColor.White);
        Squares[0, 4] = new King(PieceColor.White);
        Squares[0, 5] = new Bishop(PieceColor.White);
        Squares[0, 6] = new Knight(PieceColor.White);
        Squares[0, 7] = new Rook(PieceColor.White);

        for (int i = 0; i < Size; i++)
        {
            Squares[1, i] = new Pawn(PieceColor.White);
        }

        // Peças pretas
        Squares[7, 0] = new Rook(PieceColor.Black);
        Squares[7, 1] = new Knight(PieceColor.Black);
        Squares[7, 2] = new Bishop(PieceColor.Black);
        Squares[7, 3] = new Queen(PieceColor.Black);
        Squares[7, 4] = new King(PieceColor.Black);
        Squares[7, 5] = new Bishop(PieceColor.Black);
        Squares[7, 6] = new Knight(PieceColor.Black);
        Squares[7, 7] = new Rook(PieceColor.Black);

        for (int i = 0; i < Size; i++)
        {
            Squares[6, i] = new Pawn(PieceColor.Black);
        }
    }

    public bool MakeMove(Position from, Position to)
    {
        if (GameState != GameState.InProgress)
            return false;

        var piece = Squares[from.Rank, from.File];
        if (piece == null || piece.Color != CurrentPlayer)
            return false;

        if (!piece.IsValidMove(from, to, this))
            return false;

        // Executar movimento
        Squares[to.Rank, to.File] = piece;
        Squares[from.Rank, from.File] = null;
        piece.HasMoved = true;

        // Verificar se é xeque-mate
        if (IsCheckmate(CurrentPlayer == PieceColor.White ? PieceColor.Black : PieceColor.White))
        {
            GameState = CurrentPlayer == PieceColor.White ? GameState.WhiteWon : GameState.BlackWon;
        }

        // Alternar jogador
        CurrentPlayer = CurrentPlayer == PieceColor.White ? PieceColor.Black : PieceColor.White;

        return true;
    }

    private bool IsCheckmate(PieceColor color)
    {
        // Implementação simplificada - verificar se o rei está em xeque
        // e não há movimentos legais disponíveis
        // (Esta é uma implementação básica, um jogo real precisaria de verificação mais complexa)
        return false;
    }
}