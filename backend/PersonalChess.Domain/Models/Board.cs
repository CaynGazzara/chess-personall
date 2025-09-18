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
        Console.WriteLine($"MakeMove: from ({from.Rank},{from.File}) to ({to.Rank},{to.File})");

        // Permite movimentos mesmo em estado de Check
        if (GameState != GameState.InProgress && GameState != GameState.Check)
        {
            Console.WriteLine("Game is not in progress");
            return false;
        }

        var piece = Squares[from.Rank, from.File];
        if (piece == null || piece.Color != CurrentPlayer)
        {
            Console.WriteLine("Invalid piece selection");
            return false;
        }

        if (!piece.IsValidMove(from, to, this))
        {
            Console.WriteLine("Invalid move for this piece");
            return false;
        }

        // Simular movimento
        var tempBoard = (Piece[,])Squares.Clone();
        tempBoard[to.Rank, to.File] = piece;
        tempBoard[from.Rank, from.File] = null;

        // Verificar se movimento deixa o próprio rei em cheque
        if (IsKingInCheck(CurrentPlayer, tempBoard))
        {
            Console.WriteLine("Move would leave king in check");
            return false;
        }

        // Executar movimento real
        var capturedPiece = Squares[to.Rank, to.File]; // Peça capturada
        Squares[to.Rank, to.File] = piece;
        Squares[from.Rank, from.File] = null;
        piece.HasMoved = true;

        Console.WriteLine($"Move executed. Captured piece: {capturedPiece?.GetType().Name}");

        // VERIFICAÇÃO CRÍTICA: Se capturou o rei, fim de jogo
        if (capturedPiece is King)
        {
            GameState = CurrentPlayer == PieceColor.White ? GameState.WhiteWon : GameState.BlackWon;
            Console.WriteLine($"KING CAPTURED! {CurrentPlayer} wins!");
            return true;
        }

        // Verificar estado do jogo após movimento
        var opponentColor = CurrentPlayer == PieceColor.White ? PieceColor.Black : PieceColor.White;

        bool isOpponentInCheck = IsKingInCheck(opponentColor, Squares);
        Console.WriteLine($"{opponentColor} in check: {isOpponentInCheck}");

        if (isOpponentInCheck)
        {
            if (IsCheckmate(opponentColor))
            {
                GameState = CurrentPlayer == PieceColor.White ? GameState.WhiteWon : GameState.BlackWon;
                Console.WriteLine($"Checkmate! {CurrentPlayer} wins!");
            }
            else
            {
                GameState = GameState.Check;
                Console.WriteLine($"Check for {opponentColor}");
            }
        }
        else
        {
            if (IsStalemate(opponentColor))
            {
                GameState = GameState.Stalemate;
                Console.WriteLine("Stalemate!");
            }
            else
            {
                GameState = GameState.InProgress; // Volta para estado normal
                Console.WriteLine("Game continues normally");
            }
        }

        // Alternar jogador
        CurrentPlayer = opponentColor;
        Console.WriteLine($"New current player: {CurrentPlayer}, Game state: {GameState}");

        return true;
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
        Console.WriteLine($"Checking checkmate for {color}");

        // Primeiro verifica se o rei está em cheque
        if (!IsKingInCheck(color, Squares))
        {
            Console.WriteLine("King is not in check - not checkmate");
            return false;
        }

        // Verifica se existe algum movimento legal que saia do cheque
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

                            // Pula movimentos para a mesma posição
                            if (from.Rank == to.Rank && from.File == to.File)
                                continue;

                            if (piece.IsValidMove(from, to, this))
                            {
                                // Simula o movimento
                                var tempBoard = (Piece[,])Squares.Clone();
                                tempBoard[to.Rank, to.File] = piece;
                                tempBoard[from.Rank, from.File] = null;

                                // Verifica se o movimento tira do cheque
                                if (!IsKingInCheck(color, tempBoard))
                                {
                                    Console.WriteLine($"Legal move found: {piece.GetType().Name} from ({i},{j}) to ({x},{y})");
                                    return false; // Ainda há movimentos legais
                                }
                            }
                        }
                    }
                }
            }
        }

        Console.WriteLine("No legal moves found - CHECKMATE!");
        return true;
    }
    public void Reset()
    {
        // Reinicia o tabuleiro
        Squares = new Piece[Size, Size];
        InitializeBoard();

        // Reinicia o estado do jogo
        CurrentPlayer = PieceColor.White;
        GameState = GameState.InProgress;

        Console.WriteLine("Game reset - new game started");
    }
}