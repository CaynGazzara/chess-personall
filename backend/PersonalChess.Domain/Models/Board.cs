using PersonalChess.Domain.Enums;
using PersonalChess.Domain.Models.Pieces;
using System.Text.Json.Serialization;

namespace PersonalChess.Domain.Models;

public class Board
{
    public const int Size = 8;

    [JsonIgnore] // Não serializar a propriedade original
    public Piece[,] Squares { get; set; }

    public PieceColor CurrentPlayer { get; set; } = PieceColor.White;
    public GameState GameState { get; set; } = GameState.NotStarted;

    // Propriedade para serialização
    public object[][] SerializableSquares
    {
        get
        {
            var result = new object[Size][];
            for (int i = 0; i < Size; i++)
            {
                result[i] = new object[Size];
                for (int j = 0; j < Size; j++)
                {
                    if (Squares[i, j] != null)
                    {
                        result[i][j] = new
                        {
                            Type = Squares[i, j].Type,
                            Color = Squares[i, j].Color,
                            HasMoved = Squares[i, j].HasMoved
                        };
                    }
                    else
                    {
                        result[i][j] = null;
                    }
                }
            }
            return result;
        }
    }

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

        // Simular movimento para verificar se deixa o rei em cheque
        var tempBoard = (Piece[,])Squares.Clone();
        tempBoard[to.Rank, to.File] = piece;
        tempBoard[from.Rank, from.File] = null;

        if (IsKingInCheck(CurrentPlayer, tempBoard))
            return false; // Movimento deixaria o rei em cheque

        // Executar movimento real
        Squares[to.Rank, to.File] = piece;
        Squares[from.Rank, from.File] = null;
        piece.HasMoved = true;

        // Verificar estado do jogo após o movimento
        var opponentColor = CurrentPlayer == PieceColor.White ? PieceColor.Black : PieceColor.White;

        if (IsKingInCheck(opponentColor, Squares))
        {
            if (IsCheckmate(opponentColor))
            {
                GameState = CurrentPlayer == PieceColor.White ? GameState.WhiteWon : GameState.BlackWon;
            }
            // Pode adicionar lógica para notificar cheque aqui
        }
        else if (IsStalemate(opponentColor))
        {
            GameState = GameState.Stalemate;
        }
        else if (IsDraw()) // Implemente este método se quiser outras condições de empate
        {
            GameState = GameState.Draw;
        }

        // Alternar jogador
        CurrentPlayer = opponentColor;

        return true;
    }

    private bool IsDraw()
    {
        // Implemente condições adicionais de empate aqui
        // Exemplo: empate por insuficiência de material, regra dos 50 movimentos, etc.

        // Por enquanto, retorna false
        return false;
    }
    private bool IsStalemate(PieceColor color)
    {
        // Verifica se não está em cheque mas não tem movimentos legais
        if (IsKingInCheck(color, Squares))
            return false;

        // Verifica se existe algum movimento legal
        for (int i = 0; i < Size; i++)
        {
            for (int j = 0; j < Size; j++)
            {
                var piece = Squares[i, j];
                if (piece != null && piece.Color == color)
                {
                    for (int x = 0; x < Size; x++)
                    {
                        for (int y = 0; y < Size; y++)
                        {
                            var from = new Position(i, j);
                            var to = new Position(x, y);

                            if (piece.IsValidMove(from, to, this))
                            {
                                // Simula o movimento para ver se é legal
                                var tempBoard = (Piece[,])Squares.Clone();
                                tempBoard[to.Rank, to.File] = piece;
                                tempBoard[from.Rank, from.File] = null;

                                if (!IsKingInCheck(color, tempBoard))
                                    return false; // Ainda há movimentos legais
                            }
                        }
                    }
                }
            }
        }

        // Nenhum movimento legal encontrado - é afogamento!
        return true;
    }

    private Position FindKingPosition(PieceColor color, Piece[,] board)
    {
        for (int i = 0; i < Size; i++)
        {
            for (int j = 0; j < Size; j++)
            {
                var piece = board[i, j];
                if (piece != null && piece.Color == color && piece is King)
                {
                    return new Position(i, j);
                }
            }
        }
        throw new InvalidOperationException($"Rei das {color} não encontrado no tabuleiro!");
    }

    private bool IsKingInCheck(PieceColor color, Piece[,] board)
    {
        try
        {
            // Encontrar a posição do rei
            Position kingPosition = FindKingPosition(color, board);

            // Verificar se alguma peça adversária pode capturar o rei
            var opponentColor = color == PieceColor.White ? PieceColor.Black : PieceColor.White;

            for (int i = 0; i < Size; i++)
            {
                for (int j = 0; j < Size; j++)
                {
                    var piece = board[i, j];
                    if (piece != null && piece.Color == opponentColor)
                    {
                        if (piece.IsValidMove(new Position(i, j), kingPosition, this))
                            return true;
                    }
                }
            }
        }
        catch (InvalidOperationException)
        {
            // Se não encontrou o rei, retorna false (não está em cheque)
            return false;
        }

        return false;
    }

    private bool IsCheckmate(PieceColor color)
    {
        // Primeiro verifica se o rei está em cheque
        if (!IsKingInCheck(color, Squares))
            return false;

        // Verifica se existe algum movimento legal que saia do cheque
        for (int i = 0; i < Size; i++)
        {
            for (int j = 0; j < Size; j++)
            {
                var piece = Squares[i, j];
                if (piece != null && piece.Color == color)
                {
                    // Para cada peça da cor, verifica todos os movimentos possíveis
                    for (int x = 0; x < Size; x++)
                    {
                        for (int y = 0; y < Size; y++)
                        {
                            var from = new Position(i, j);
                            var to = new Position(x, y);

                            if (piece.IsValidMove(from, to, this))
                            {
                                // Simula o movimento
                                var tempBoard = (Piece[,])Squares.Clone();
                                tempBoard[to.Rank, to.File] = piece;
                                tempBoard[from.Rank, from.File] = null;

                                // Verifica se ainda está em cheque após o movimento
                                if (!IsKingInCheck(color, tempBoard))
                                    return false; // Ainda há movimentos legais
                            }
                        }
                    }
                }
            }
        }

        // Nenhum movimento legal encontrado - é cheque-mate!
        return true;
    }
}