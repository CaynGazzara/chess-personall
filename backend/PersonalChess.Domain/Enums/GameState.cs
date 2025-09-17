namespace PersonalChess.Domain.Enums;

public enum GameState
{
    NotStarted,
    InProgress,
    WhiteWon,
    BlackWon,
    Draw,
    Stalemate
}

// Adicione método de extensão para converter para string
public static class GameStateExtensions
{
    public static string ToString(this GameState gameState)
    {
        return gameState switch
        {
            GameState.NotStarted => "NotStarted",
            GameState.InProgress => "InProgress",
            GameState.WhiteWon => "WhiteWon",
            GameState.BlackWon => "BlackWon",
            GameState.Draw => "Draw",
            GameState.Stalemate => "Stalemate",
            _ => "Unknown"
        };
    }
}