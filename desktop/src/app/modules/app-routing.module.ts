import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { GameCreationPageComponent } from '@app/pages/multiplayer-create-page/game-creation-page.component';
import { MultiplayerJoinPageComponent } from '@app/pages/multiplayer-join-page/multiplayer-join-page.component';
import { WaitingOpponentPageComponent } from '@app/pages/waiting-opponent-page/waiting-opponent-page.component';

const routes: Routes = [
    { path: '', redirectTo: AppRoutes.HomePage, pathMatch: 'full' },
    { path: AppRoutes.AdminPage, component: AdminPageComponent },
    { path: AppRoutes.HomePage, component: MainPageComponent },
    { path: AppRoutes.GamePage, component: GamePageComponent },
    { path: '${AppRoutes.SoloGameCreationPage}:id', component: GameCreationPageComponent },
    { path: '${AppRoutes.MultiJoinPage}:id', component: MultiplayerJoinPageComponent },
    { path: '${AppRoutes.MultiGameCreationPage}:id', component: GameCreationPageComponent },
    { path: '${AppRoutes.MultiWaitingPage}:id', component: WaitingOpponentPageComponent },
    { path: '**', redirectTo: AppRoutes.HomePage },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
