import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Position } from '../models/position.model';
import { environment } from '../../environments/environment';

export interface BoardResponse {
  squares: any[][]; // Agora é um array bidimensional regular
  currentPlayer: string;
  gameState: string;
}

export interface MoveResponse {
  success: boolean;
  board?: BoardResponse;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChessService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Método personalizado para ignorar erros SSL (apenas desenvolvimento)
  private createOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      })
    };
  }

  getBoard(): Observable<BoardResponse> {
    return this.http.get<BoardResponse>(this.apiUrl + '/board', this.createOptions()).pipe(catchError(this.handleError));
  }

  makeMove(from: Position, to: Position): Observable<MoveResponse> {
    return this.http.post<MoveResponse>(this.apiUrl + '/move', { from, to }, this.createOptions()).pipe(catchError(this.handleError));
  }

  resetGame(): Observable<any> {
    return this.http.post(this.apiUrl + '/reset', {}, this.createOptions()).pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('HTTP Error:', error);

    let errorMessage = 'Erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
      } else if (error.status === 400) {
        // Movimento inválido - usa a mensagem do backend
        errorMessage = error.error?.message || 'Movimento inválido';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint não encontrado';
      } else if (error.status >= 500) {
        errorMessage = 'Erro interno do servidor';
      } else {
        errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}