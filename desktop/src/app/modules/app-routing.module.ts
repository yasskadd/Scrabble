import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { ConnectionPageComponent } from '@app/pages/connection-page/connection-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { GameCreationPageComponent } from '@app/pages/multiplayer-create-page/game-creation-page.component';
import { MultiplayerJoinPageComponent } from '@app/pages/multiplayer-join-page/multiplayer-join-page.component';
import { SettingsPageComponent } from '@app/pages/settings-page/settings-page.component';
import { UserCreationPageComponent } from '@app/pages/user-creation-page/user-creation-page.component';
import { UserProfilePageComponent } from '@app/pages/user-profile-page/user-profile-page.component';
import { WaitingOpponentPageComponent } from '@app/pages/waiting-opponent-page/waiting-opponent-page.component';
import { GenericChatComponent } from '@app/components/chat/generic-chat/generic-chat.component';

const routes: Routes = [
    { path: '', redirectTo: AppRoutes.ConnectionPage, pathMatch: 'full' },
    { path: AppRoutes.AdminPage, component: AdminPageComponent },
    { path: AppRoutes.HomePage, component: MainPageComponent },
    { path: AppRoutes.GamePage, component: GamePageComponent },
    { path: AppRoutes.UserCreationPage, component: UserCreationPageComponent },
    { path: AppRoutes.UserProfilePage, component: UserProfilePageComponent },
    { path: AppRoutes.ConnectionPage, component: ConnectionPageComponent },
    { path: AppRoutes.SettingsPage, component: SettingsPageComponent },
    { path: `${AppRoutes.SoloGameCreationPage}/:id`, component: GameCreationPageComponent },
    { path: `${AppRoutes.MultiJoinPage}/:id`, component: MultiplayerJoinPageComponent },
    { path: `${AppRoutes.MultiGameCreationPage}/:id`, component: GameCreationPageComponent },
    { path: `${AppRoutes.MultiWaitingPage}/:id`, component: WaitingOpponentPageComponent },
    { path: `${AppRoutes.Chat}`, component: GenericChatComponent },
    { path: `${AppRoutes.Chat}/:id`, component: GenericChatComponent },
    { path: '**', redirectTo: AppRoutes.ConnectionPage },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
