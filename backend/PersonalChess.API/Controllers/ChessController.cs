using Microsoft.AspNetCore.Mvc;
using PersonalChess.Domain.Enums;
using PersonalChess.Domain.Models;

namespace PersonalChess.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChessController : ControllerBase
{
    private static Board _board = new Board();

    [HttpGet("board")]
    public IActionResult GetBoard()
    {
        var boardResponse = new
        {
            Squares = ConvertBoardToDto(_board.Squares),
            CurrentPlayer = _board.CurrentPlayer,
            GameState = _board.GameState
        };

        return Ok(boardResponse);
    }

    [HttpPost("move")]
    public IActionResult MakeMove([FromBody] MoveRequest moveRequest)
    {
        var from = new Position(moveRequest.From.Rank, moveRequest.From.File);
        var to = new Position(moveRequest.To.Rank, moveRequest.To.File);

        if (_board.MakeMove(from, to))
        {
            var response = new
            {
                Success = true,
                Board = new
                {
                    Squares = ConvertBoardToDto(_board.Squares),
                    CurrentPlayer = _board.CurrentPlayer,
                    GameState = _board.GameState
                }
            };

            return Ok(response);
        }

        return BadRequest(new { Success = false, Message = "Movimento inválido" });
    }

    [HttpPost("reset")]
    public IActionResult ResetGame()
    {
        _board = new Board();
        return Ok(new { Success = true, Message = "Jogo reiniciado" });
    }

    private object[,] ConvertBoardToDto(Piece[,] squares)
    {
        var result = new object[Board.Size, Board.Size];

        for (int i = 0; i < Board.Size; i++)
        {
            for (int j = 0; j < Board.Size; j++)
            {
                if (squares[i, j] != null)
                {
                    result[i, j] = new
                    {
                        Type = squares[i, j].Type,
                        Color = squares[i, j].Color,
                        HasMoved = squares[i, j].HasMoved
                    };
                }
                else
                {
                    result[i, j] = null;
                }
            }
        }

        return result;
    }
}

public class MoveRequest
{
    public PositionDto From { get; set; }
    public PositionDto To { get; set; }
}

public class PositionDto
{
    public int Rank { get; set; }
    public int File { get; set; }
}