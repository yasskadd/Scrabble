import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { MultiplayerCreatePageComponent } from '@app/pages/multiplayer-create-page/multiplayer-create-page.component';
import { MultiplayerJoinPageComponent } from '@app/pages/multiplayer-join-page/multiplayer-join-page.component';
import { WaitingOpponentPageComponent } from '@app/pages/waiting-opponent-page/waiting-opponent-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'material', component: MaterialPageComponent },
    { path: 'classique/multijoueur/rejoindre', component: MultiplayerJoinPageComponent },
    { path: 'classique/multijoueur/creer', component: MultiplayerCreatePageComponent },
    { path: 'classique/multijoueur/salleAttente', component: WaitingOpponentPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
