import { Component, OnInit } from '@angular/core';
import { ChessService, BoardResponse } from '../../services/chess.service';
import { Position } from '../../models/position.model';
import { PieceColor } from '../../models/enums/piece-color.enum';
import { GameState } from '../../models/game-state.enum';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  standalone: false,
  styleUrls: ['./chess-board.component.css']
})
export class ChessBoardComponent implements OnInit {
  board: any[][] = [];
  selectedPiece: { position: Position, piece: any } | null = null;
  currentPlayer: string = PieceColor.White;
  gameState: string = GameState.NotStarted;
  possibleMoves: Position[] = [];

  constructor(private chessService: ChessService) { }

  ngOnInit(): void {
    this.loadBoard();
  }

  loadBoard(): void {
    this.chessService.getBoard().subscribe({
      next: (data: any) => {
        this.board = data.squares;

        // Converta valores numéricos para strings
        this.currentPlayer = this.convertPieceColor(data.currentPlayer);
        this.gameState = this.convertGameState(data.gameState);

        this.selectedPiece = null;
        this.possibleMoves = [];

        console.log('Board loaded - GameState:', this.gameState, 'CurrentPlayer:', this.currentPlayer);
      },
      error: (error) => {
        console.error('Error loading board:', error);
        alert('Erro ao carregar o tabuleiro');
      }
    });
  }

  onSquareClick(row: number, col: number): void {
    console.log('Clicked on:', row, col, 'Piece:', this.board[row][col]);
    console.log('Game State:', this.gameState);
    console.log('Current Player:', this.currentPlayer);

    // Use a versão convertida para comparação
    if (this.gameState !== GameState.InProgress) {
      alert(`Jogo não está em andamento! Estado atual: ${this.gameState}`);
      return;
    }

    const clickedPosition: Position = { rank: row, file: col };
    const clickedPiece = this.board[row][col];

    // Converta a cor da peça clicada para string para comparação
    const clickedPieceColor = this.convertPieceColor(clickedPiece?.color);

    // Se já temos uma peça selecionada, tentar mover
    if (this.selectedPiece) {
      console.log('Attempting move from:', this.selectedPiece.position, 'to:', clickedPosition);
      this.attemptMove(this.selectedPiece.position, clickedPosition);
    }
    // Se não há peça selecionada e clicamos em uma peça do jogador atual
    else if (clickedPiece && clickedPieceColor === this.currentPlayer) {
      console.log('Selected piece:', clickedPiece);
      this.selectedPiece = { position: clickedPosition, piece: clickedPiece };
      this.calculatePossibleMoves(clickedPosition, clickedPiece);
    }
    // Se clicamos em um espaço vazio ou peça do oponente sem ter selecionado nada
    else {
      console.log('Deselecting piece');
      this.selectedPiece = null;
      this.possibleMoves = [];
    }
  }

  // Métodos de conversão
  private convertPieceColor(color: any): string {
    if (typeof color === 'number') {
      // 0 = White, 1 = Black
      return color === 0 ? PieceColor.White : PieceColor.Black;
    }
    return color;
  }

  private convertGameState(state: any): string {
    if (typeof state === 'number') {
      // Mapeamento baseado na ordem do enum C#
      const states = [
        GameState.NotStarted,    // 0
        GameState.InProgress,    // 1  
        GameState.WhiteWon,      // 2
        GameState.BlackWon,      // 3
        GameState.Draw,          // 4
        GameState.Stalemate      // 5
      ];
      return states[state] || 'Unknown';
    }
    return state;
  }

  // Método auxiliar para converter cor da peça para exibição
  getPieceColorDisplay(color: any): string {
    return this.convertPieceColor(color);
  }

  attemptMove(from: Position, to: Position): void {
    this.chessService.makeMove(from, to).subscribe({
      next: (response: any) => {
        if (response.success && response.board) {
          this.board = response.board.squares;
          this.currentPlayer = this.convertPieceColor(response.board.currentPlayer);
          this.gameState = this.convertGameState(response.board.gameState);

          // Mensagens de feedback
          if (this.gameState === GameState.WhiteWon) {
            alert('Brancas venceram! ♔');
          } else if (this.gameState === GameState.BlackWon) {
            alert('Pretas venceram! ♚');
          } else if (this.gameState === GameState.Draw) {
            alert('Empate! 🏳️');
          } else if (this.gameState === GameState.Stalemate) {
            alert('Afogamento! 🤝');
          }

        } else {
          // Mensagens de erro mais específicas
          const errorMessage = response.message || 'Movimento inválido';
          this.showMoveError(errorMessage);
        }
        this.selectedPiece = null;
        this.possibleMoves = [];
      },
      error: (error) => {
        console.error('Error making move:', error);
        this.showMoveError('Erro de comunicação com o servidor');
        this.selectedPiece = null;
        this.possibleMoves = [];
      }
    });
  }

  private showMoveError(message: string): void {
    // Você pode substituir por um toast/snackbar mais elegante
    alert(`❌ ${message}`);
  }

  calculatePossibleMoves(position: Position, piece: any): void {
    this.possibleMoves = [];

    const fromRow = position.rank;
    const fromCol = position.file;
    const pieceColor = this.convertPieceColor(piece.color);

    switch (piece.type) {
      case 'Pawn':
        this.calculatePawnMoves(fromRow, fromCol, pieceColor, piece.hasMoved);
        break;
      case 'Rook':
        this.calculateRookMoves(fromRow, fromCol, pieceColor);
        break;
      case 'Knight':
        this.calculateKnightMoves(fromRow, fromCol, pieceColor);
        break;
      case 'Bishop':
        this.calculateBishopMoves(fromRow, fromCol, pieceColor);
        break;
      case 'Queen':
        this.calculateQueenMoves(fromRow, fromCol, pieceColor);
        break;
      case 'King':
        this.calculateKingMoves(fromRow, fromCol, pieceColor, piece.hasMoved);
        break;
    }

    console.log('Possible moves:', this.possibleMoves);
  }

  isPossibleMove(row: number, col: number): boolean {
    return this.possibleMoves.some(move =>
      move.rank === row && move.file === col
    );
  }

  getPieceImage(piece: any): string | null {
    if (!piece) return null;

    // Use the existing converter to normalize color (handles numeric enums)
    const colorRaw = this.convertPieceColor(piece.color);
    if (!colorRaw) return null;

    const colorStr = String(colorRaw).toLowerCase();
    const typeStr = piece.type ? String(piece.type).toLowerCase() : '';
    if (!typeStr) return null;

    // Return absolute path from site root to avoid relative-path 404s
    return `/assets/images/chess-pieces/${colorStr}-${typeStr}.svg`;
  }

  getFileLetter(file: number): string {
    return String.fromCharCode(97 + file);
  }

  resetGame(): void {
    this.chessService.resetGame().subscribe({
      next: () => {
        this.loadBoard();
      },
      error: (error) => {
        console.error('Error resetting game:', error);
        alert('Erro ao reiniciar o jogo');
      }
    });
  }

  // Peão
  private calculatePawnMoves(fromRow: number, fromCol: number, color: string, hasMoved: boolean): void {
    const direction = color === PieceColor.White ? 1 : -1;
    const startRow = color === PieceColor.White ? 1 : 6;

    // Movimento para frente
    const forwardRow = fromRow + direction;
    if (this.isValidPosition(forwardRow, fromCol) && !this.board[forwardRow][fromCol]) {
      this.possibleMoves.push({ rank: forwardRow, file: fromCol });

      // Movimento duplo inicial
      if (fromRow === startRow && !hasMoved) {
        const doubleRow = fromRow + 2 * direction;
        if (this.isValidPosition(doubleRow, fromCol) && !this.board[doubleRow][fromCol]) {
          this.possibleMoves.push({ rank: doubleRow, file: fromCol });
        }
      }
    }

    // Capturas
    const captureLeft = { rank: forwardRow, file: fromCol - 1 };
    const captureRight = { rank: forwardRow, file: fromCol + 1 };

    [captureLeft, captureRight].forEach(capture => {
      if (this.isValidPosition(capture.rank, capture.file)) {
        const targetPiece = this.board[capture.rank][capture.file];
        if (targetPiece && this.convertPieceColor(targetPiece.color) !== color) {
          this.possibleMoves.push(capture);
        }
      }
    });
  }

  // Torre
  private calculateRookMoves(fromRow: number, fromCol: number, color: string): void {
    const directions = [
      { dr: 1, dc: 0 },  // Baixo
      { dr: -1, dc: 0 }, // Cima
      { dr: 0, dc: 1 },  // Direita
      { dr: 0, dc: -1 }  // Esquerda
    ];

    this.calculateSlidingMoves(fromRow, fromCol, color, directions);
  }

  // Cavalo
  private calculateKnightMoves(fromRow: number, fromCol: number, color: string): void {
    const knightMoves = [
      { dr: 2, dc: 1 }, { dr: 2, dc: -1 },
      { dr: -2, dc: 1 }, { dr: -2, dc: -1 },
      { dr: 1, dc: 2 }, { dr: 1, dc: -2 },
      { dr: -1, dc: 2 }, { dr: -1, dc: -2 }
    ];

    knightMoves.forEach(move => {
      const newRow = fromRow + move.dr;
      const newCol = fromCol + move.dc;

      if (this.isValidPosition(newRow, newCol)) {
        const targetPiece = this.board[newRow][newCol];
        if (!targetPiece || this.convertPieceColor(targetPiece.color) !== color) {
          this.possibleMoves.push({ rank: newRow, file: newCol });
        }
      }
    });
  }

  // Bispo
  private calculateBishopMoves(fromRow: number, fromCol: number, color: string): void {
    const directions = [
      { dr: 1, dc: 1 },   // Diagonal inferior direita
      { dr: 1, dc: -1 },  // Diagonal inferior esquerda
      { dr: -1, dc: 1 },  // Diagonal superior direita
      { dr: -1, dc: -1 }  // Diagonal superior esquerda
    ];

    this.calculateSlidingMoves(fromRow, fromCol, color, directions);
  }

  // Rainha
  private calculateQueenMoves(fromRow: number, fromCol: number, color: string): void {
    const directions = [
      { dr: 1, dc: 0 }, { dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
      { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 }
    ];

    this.calculateSlidingMoves(fromRow, fromCol, color, directions);
  }

  // Rei
  private calculateKingMoves(fromRow: number, fromCol: number, color: string, hasMoved: boolean): void {
    const kingMoves = [
      { dr: 1, dc: 0 }, { dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
      { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 }
    ];

    kingMoves.forEach(move => {
      const newRow = fromRow + move.dr;
      const newCol = fromCol + move.dc;

      if (this.isValidPosition(newRow, newCol)) {
        const targetPiece = this.board[newRow][newCol];
        if (!targetPiece || this.convertPieceColor(targetPiece.color) !== color) {
          this.possibleMoves.push({ rank: newRow, file: newCol });
        }
      }
    });

    // TODO: Implementar roque (castling)
  }

  // Método auxiliar para peças que se movem em linha (Torre, Bispo, Rainha)
  private calculateSlidingMoves(fromRow: number, fromCol: number, color: string, directions: any[]): void {
    directions.forEach(dir => {
      let currentRow = fromRow + dir.dr;
      let currentCol = fromCol + dir.dc;

      while (this.isValidPosition(currentRow, currentCol)) {
        const targetPiece = this.board[currentRow][currentCol];

        if (!targetPiece) {
          // Casa vazia - pode mover
          this.possibleMoves.push({ rank: currentRow, file: currentCol });
        } else {
          // Casa ocupada
          if (this.convertPieceColor(targetPiece.color) !== color) {
            // Peça adversária - pode capturar
            this.possibleMoves.push({ rank: currentRow, file: currentCol });
          }
          // Para de verificar nesta direção (peça bloqueia o movimento)
          break;
        }

        currentRow += dir.dr;
        currentCol += dir.dc;
      }
    });
  }

  // Método auxiliar para verificar se a posição é válida
  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
}