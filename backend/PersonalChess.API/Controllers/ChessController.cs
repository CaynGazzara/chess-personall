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
            Squares = _board.SerializableSquares,
            CurrentPlayer = _board.CurrentPlayer.ToString(), // Use a conversão
            GameState = _board.GameState.ToString() // Use a conversão
        };

        Console.WriteLine($"Returning board - GameState: {_board.GameState}, CurrentPlayer: {_board.CurrentPlayer}");

        return Ok(boardResponse);
    }

    [HttpPost("move")]
    public IActionResult MakeMove([FromBody] MoveRequest moveRequest)
    {
        try
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
                        Squares = _board.SerializableSquares,
                        CurrentPlayer = _board.CurrentPlayer.ToString(),
                        GameState = _board.GameState.ToString()
                    },
                    Message = "Movimento realizado com sucesso"
                };

                return Ok(response);
            }

            return BadRequest(new
            {
                Success = false,
                Message = "Movimento inválido - pode estar deixando o rei em cheque ou violando as regras do xadrez"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Success = false,
                Message = $"Erro interno: {ex.Message}"
            });
        }
    }

    [HttpPost("reset")]
    public IActionResult ResetGame()
    {
        try
        {
            _board.Reset();

            var boardResponse = new
            {
                Squares = _board.SerializableSquares,
                CurrentPlayer = _board.CurrentPlayer.ToString(),
                GameState = _board.GameState.ToString()
            };

            return Ok(new
            {
                Success = true,
                Message = "Jogo reiniciado com sucesso",
                Board = boardResponse
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Success = false,
                Message = $"Erro ao reiniciar o jogo: {ex.Message}"
            });
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
}