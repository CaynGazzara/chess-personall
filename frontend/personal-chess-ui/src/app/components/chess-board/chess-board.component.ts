import { Component, OnInit } from '@angular/core';
import { ChessService, BoardResponse } from '../../services/chess.service';
import { Position } from '../../models/position.model';
import { PieceColor } from '../../models/enums/piece-color.enum';
import { GameState } from '../../models/game-state.enum';
import { Router } from '@angular/router';

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

  constructor(private chessService: ChessService, private router: Router) { }

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

        // board loaded
      },
      error: (error) => {
        console.error('Error loading board:', error);
        this.showNotification('Erro ao carregar o tabuleiro', 'error');
      }
    });
  }

  onSquareClick(row: number, col: number): void {
    // click handled

    // CORREÇÃO: "Check" ainda é um estado de jogo em andamento
    if (this.gameState !== GameState.InProgress && this.gameState !== GameState.Check) {
      alert(`Jogo não está em andamento! Estado atual: ${this.gameState}`);
      return;
    }

    const clickedPosition: Position = { rank: row, file: col };
    const clickedPiece = this.board[row][col];

    // Converta a cor da peça clicada para string para comparação
    const clickedPieceColor = this.convertPieceColor(clickedPiece?.color);

    // Se já temos uma peça selecionada, tentar mover
    if (this.selectedPiece) {
      // attempting move
      this.attemptMove(this.selectedPiece.position, clickedPosition);
    }
    // Se não há peça selecionada e clicamos em uma peça do jogador atual
    else if (clickedPiece && clickedPieceColor === this.currentPlayer) {
      // selected piece
      this.selectedPiece = { position: clickedPosition, piece: clickedPiece };
      this.calculatePossibleMoves(clickedPosition, clickedPiece);
    }
    // Se clicamos em um espaço vazio ou peça do oponente sem ter selecionado nada
    else {
      // deselecting piece
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
        GameState.NotStarted,
        GameState.InProgress,
        GameState.Check,
        GameState.WhiteWon,
        GameState.BlackWon,
        GameState.Draw,
        GameState.Stalemate
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
            this.showNotification('Brancas venceram! ♔', 'success');
          } else if (this.gameState === GameState.BlackWon) {
            this.showNotification('Pretas venceram! ♚', 'success');
          } else if (this.gameState === GameState.Draw) {
            this.showNotification('Empate! 🏳️', 'info');
          } else if (this.gameState === GameState.Stalemate) {
            this.showNotification('Afogamento! 🤝', 'info');
          }

        } else {
          // Mensagens de erro mais específicas
          const errorMessage = response.message || 'Movimento inválido';
          this.showMoveError(errorMessage);
        }
        this.selectedPiece = null;
        this.possibleMoves = [];
      },
      error: (error: Error) => {
        console.error('Error making move:', error);
        this.showMoveError(error.message); // Agora usa a mensagem específica
        this.selectedPiece = null;
        this.possibleMoves = [];
      }
    });
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
      next: (response: any) => {
        if (response.success) {
          console.log('Game reset successfully', response);

          // Atualize o board com a resposta se disponível
          if (response.board) {
            this.board = response.board.squares;
            this.currentPlayer = this.convertPieceColor(response.board.currentPlayer);
            this.gameState = this.convertGameState(response.board.gameState);
          } else {
            // Se não vier board na resposta, recarregue
            this.loadBoard();
          }

          this.selectedPiece = null;
          this.possibleMoves = [];

          this.showNotification('Jogo reiniciado! ♻️', 'success');
        } else {
          this.showNotification('Erro ao reiniciar o jogo', 'error');
        }
      },
      error: (error) => {
        console.error('Error resetting game:', error);
        this.showNotification('Erro ao reiniciar o jogo', 'error');

        // Fallback: recarregar o board mesmo com erro
        this.loadBoard();
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
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

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Remove notificações anteriores
    const existingNotifications = document.querySelectorAll('.chess-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `chess-notification ${type}`;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;

    switch (type) {
      case 'success':
        notification.style.background = '#4CAF50';
        break;
      case 'error':
        notification.style.background = '#f44336';
        break;
      case 'info':
        notification.style.background = '#2196F3';
        break;
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove após 3 segundos
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  // Atualize o showMoveError para usar o novo sistema
  private showMoveError(message: string): void {
    this.showNotification(`❌ ${message}`, 'error');
  }
}