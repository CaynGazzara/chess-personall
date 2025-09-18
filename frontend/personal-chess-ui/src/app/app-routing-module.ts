import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { ChessBoardComponent } from './components/chess-board/chess-board.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'game', component: ChessBoardComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
