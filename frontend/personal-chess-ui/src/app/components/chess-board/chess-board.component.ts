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
      if (this.isPossibleMove(row, col)) {
        this.attemptMove(this.selectedPiece.position, clickedPosition);
      }
      this.selectedPiece = null;
      this.possibleMoves = [];
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
    const playerBeforeMove = this.currentPlayer;

    this.chessService.makeMove(from, to).subscribe({
      next: (response: any) => {
        if (response.success && response.board) {
          this.board = response.board.squares;
          this.currentPlayer = this.convertPieceColor(response.board.currentPlayer);
          this.gameState = this.convertGameState(response.board.gameState);

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
    const typeStr = piece.type ? String(piece.type).toLowerCase() : '';
    if (!typeStr) return null;
    return `/assets/images/chess-pieces/${colorRaw.toLowerCase()}-${typeStr}.svg`;
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

  // Movimentações completas para todas as peças
  private calculatePawnMoves(fromRow: number, fromCol: number, color: string, hasMoved: boolean): void {
    const direction = color === PieceColor.White ? 1 : -1;
    const startRow = color === PieceColor.White ? 1 : 6;
    const forwardRow = fromRow + direction;

    // Movimento para frente (sem captura)
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

    // Capturas diagonais
    [fromCol - 1, fromCol + 1].forEach(captureCol => {
      if (this.isValidPosition(forwardRow, captureCol)) {
        const targetPiece = this.board[forwardRow][captureCol];
        if (targetPiece && this.convertPieceColor(targetPiece.color) !== color) {
          this.possibleMoves.push({ rank: forwardRow, file: captureCol });
        }
      }
    });

    // TODO: En passant e promoção de peão
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

    // Roque (Castling) - regras simplificadas: só considera roque se rei e torre não moveram, e caminho está livre
    if (!hasMoved) {
      // Roque pequeno
      if (this.isValidCastling(fromRow, fromCol, color, true)) {
        this.possibleMoves.push({ rank: fromRow, file: fromCol + 2 });
      }
      // Roque grande
      if (this.isValidCastling(fromRow, fromCol, color, false)) {
        this.possibleMoves.push({ rank: fromRow, file: fromCol - 2 });
      }
    }
  }

  private isValidCastling(row: number, col: number, color: string, kingside: boolean): boolean {
    // Simplificação: verifica se torre não moveu, caminho está livre, não está em cheque
    const rookCol = kingside ? 7 : 0;
    const direction = kingside ? 1 : -1;
    const rook = this.board[row][rookCol];
    if (!rook || rook.type !== 'Rook' || rook.color !== color || rook.hasMoved) return false;

    // Casas entre rei e torre devem estar vazias
    for (let c = col + direction; kingside ? c < rookCol : c > rookCol; c += direction) {
      if (this.board[row][c]) return false;
    }
    // TODO: Não pode passar por casas atacadas (não implementado)
    return true;
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