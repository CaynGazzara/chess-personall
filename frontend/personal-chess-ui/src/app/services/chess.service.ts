import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<BoardResponse>(this.apiUrl + '/board', this.createOptions());
  }

  makeMove(from: Position, to: Position): Observable<MoveResponse> {
    return this.http.post<MoveResponse>(this.apiUrl + '/move', { from, to }, this.createOptions());
  }

  resetGame(): Observable<any> {
    return this.http.post(this.apiUrl + '/reset', {}, this.createOptions());
  }
}