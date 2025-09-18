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
  capturedWhite: string[] = [];
  capturedBlack: string[] = [];

  constructor(private chessService: ChessService, private router: Router) { }

  ngOnInit(): void {
    this.loadBoard();
    // (Opcional para teste) Mockar cemitérios:
    // this.capturedWhite = ['/assets/images/chess-pieces/white-pawn.svg'];
    // this.capturedBlack = ['/assets/images/chess-pieces/black-pawn.svg'];
  }

  loadBoard(): void {
    this.chessService.getBoard().subscribe({
      next: (data: any) => {
        this.board = data.squares;
        this.currentPlayer = this.convertPieceColor(data.currentPlayer);
        this.gameState = this.convertGameState(data.gameState);
        this.selectedPiece = null;
        this.possibleMoves = [];
        // Não limpa os cemitérios aqui para não perder capturas durante o jogo!
      },
      error: (error) => {
        console.error('Error loading board:', error);
        this.showNotification('Erro ao carregar o tabuleiro', 'error');
      }
    });
  }

  onSquareClick(row: number, col: number): void {
    if (this.gameState !== GameState.InProgress && this.gameState !== GameState.Check) {
      alert(`Jogo não está em andamento! Estado atual: ${this.gameState}`);
      return;
    }

    const clickedPosition: Position = { rank: row, file: col };
    const clickedPiece = this.board[row][col];
    const clickedPieceColor = this.convertPieceColor(clickedPiece?.color);

    if (this.selectedPiece) {
      this.attemptMove(this.selectedPiece.position, clickedPosition);
    }
    else if (clickedPiece && clickedPieceColor === this.currentPlayer) {
      this.selectedPiece = { position: clickedPosition, piece: clickedPiece };
      this.calculatePossibleMoves(clickedPosition, clickedPiece);
    }
    else {
      this.selectedPiece = null;
      this.possibleMoves = [];
    }
  }

  private convertPieceColor(color: any): string {
    if (typeof color === 'number') {
      return color === 0 ? PieceColor.White : PieceColor.Black;
    }
    return color;
  }

  private convertGameState(state: any): string {
    if (typeof state === 'number') {
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

  getPieceColorDisplay(color: any): string {
    return this.convertPieceColor(color);
  }

  attemptMove(from: Position, to: Position): void {
    const targetPieceBeforeMove = this.board[to.rank][to.file];
    const playerBeforeMove = this.currentPlayer; // Salva a cor do jogador antes do movimento

    this.chessService.makeMove(from, to).subscribe({
      next: (response: any) => {
        if (response.success && response.board) {
          this.board = response.board.squares;
          this.currentPlayer = this.convertPieceColor(response.board.currentPlayer);
          this.gameState = this.convertGameState(response.board.gameState);

          // CORREÇÃO: compara com playerBeforeMove, não com currentPlayer pós-movimento!
          if (
            targetPieceBeforeMove &&
            this.convertPieceColor(targetPieceBeforeMove.color) !== playerBeforeMove
          ) {
            const color = this.convertPieceColor(targetPieceBeforeMove.color);
            const type = targetPieceBeforeMove.type ? String(targetPieceBeforeMove.type).toLowerCase() : '';
            const imgPath = `/assets/images/chess-pieces/${color.toLowerCase()}-${type}.svg`;
            if (color === PieceColor.White) {
              this.capturedWhite = [...this.capturedWhite, imgPath];
            } else if (color === PieceColor.Black) {
              this.capturedBlack = [...this.capturedBlack, imgPath];
            }
          }

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
          const errorMessage = response.message || 'Movimento inválido';
          this.showMoveError(errorMessage);
        }
        this.selectedPiece = null;
        this.possibleMoves = [];
      },
      error: (error: Error) => {
        console.error('Error making move:', error);
        this.showMoveError(error.message);
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
  }

  isPossibleMove(row: number, col: number): boolean {
    return this.possibleMoves.some(move =>
      move.rank === row && move.file === col
    );
  }

  getPieceImage(piece: any): string | null {
    if (!piece) return null;
    const colorRaw = this.convertPieceColor(piece.color);
    if (!colorRaw) return null;
    const colorStr = String(colorRaw).toLowerCase();
    const typeStr = piece.type ? String(piece.type).toLowerCase() : '';
    if (!typeStr) return null;
    return `/assets/images/chess-pieces/${colorStr}-${typeStr}.svg`;
  }

  getFileLetter(file: number): string {
    return String.fromCharCode(97 + file);
  }

  resetGame(): void {
    this.chessService.resetGame().subscribe({
      next: (response: any) => {
        if (response.success) {
          if (response.board) {
            this.board = response.board.squares;
            this.currentPlayer = this.convertPieceColor(response.board.currentPlayer);
            this.gameState = this.convertGameState(response.board.gameState);
          } else {
            this.loadBoard();
          }
          this.selectedPiece = null;
          this.possibleMoves = [];
          this.capturedWhite = [];
          this.capturedBlack = [];
          this.showNotification('Jogo reiniciado! ♻️', 'success');
        } else {
          this.showNotification('Erro ao reiniciar o jogo', 'error');
        }
      },
      error: (error) => {
        console.error('Error resetting game:', error);
        this.showNotification('Erro ao reiniciar o jogo', 'error');
        this.loadBoard();
        this.capturedWhite = [];
        this.capturedBlack = [];
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private calculatePawnMoves(fromRow: number, fromCol: number, color: string, hasMoved: boolean): void {
    const direction = color === PieceColor.White ? 1 : -1;
    const startRow = color === PieceColor.White ? 1 : 6;
    const forwardRow = fromRow + direction;
    if (this.isValidPosition(forwardRow, fromCol) && !this.board[forwardRow][fromCol]) {
      this.possibleMoves.push({ rank: forwardRow, file: fromCol });
      if (fromRow === startRow && !hasMoved) {
        const doubleRow = fromRow + 2 * direction;
        if (this.isValidPosition(doubleRow, fromCol) && !this.board[doubleRow][fromCol]) {
          this.possibleMoves.push({ rank: doubleRow, file: fromCol });
        }
      }
    }
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

  private calculateRookMoves(fromRow: number, fromCol: number, color: string): void {
    const directions = [
      { dr: 1, dc: 0 }, { dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 0, dc: -1 }
    ];
    this.calculateSlidingMoves(fromRow, fromCol, color, directions);
  }

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

  private calculateBishopMoves(fromRow: number, fromCol: number, color: string): void {
    const directions = [
      { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 }
    ];
    this.calculateSlidingMoves(fromRow, fromCol, color, directions);
  }

  private calculateQueenMoves(fromRow: number, fromCol: number, color: string): void {
    const directions = [
      { dr: 1, dc: 0 }, { dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
      { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 }
    ];
    this.calculateSlidingMoves(fromRow, fromCol, color, directions);
  }

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

  private calculateSlidingMoves(fromRow: number, fromCol: number, color: string, directions: any[]): void {
    directions.forEach(dir => {
      let currentRow = fromRow + dir.dr;
      let currentCol = fromCol + dir.dc;
      while (this.isValidPosition(currentRow, currentCol)) {
        const targetPiece = this.board[currentRow][currentCol];
        if (!targetPiece) {
          this.possibleMoves.push({ rank: currentRow, file: currentCol });
        } else {
          if (this.convertPieceColor(targetPiece.color) !== color) {
            this.possibleMoves.push({ rank: currentRow, file: currentCol });
          }
          break;
        }
        currentRow += dir.dr;
        currentCol += dir.dc;
      }
    });
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
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
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  private showMoveError(message: string): void {
    this.showNotification(`❌ ${message}`, 'error');
  }
}