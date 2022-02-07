import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { ChatboxComponent } from './components/chatbox/chatbox.component';
import { DialogBoxComponent } from './components/dialog-box/dialog-box.component';
import { InformationPanelComponent } from './components/information-panel/information-panel.component';
import { PlayerRackComponent } from './components/player-rack/player-rack.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { MultiplayerCreatePageComponent } from './pages/multiplayer-create-page/multiplayer-create-page.component';
import { MultiplayerJoinPageComponent } from './pages/multiplayer-join-page/multiplayer-join-page.component';
import { WaitingOpponentPageComponent } from './pages/waiting-opponent-page/waiting-opponent-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        MaterialPageComponent,
        PlayAreaComponent,
        SidebarComponent,
        MultiplayerJoinPageComponent,
        MultiplayerCreatePageComponent,
        WaitingOpponentPageComponent,
        ChatboxComponent,
        DialogBoxComponent,
        InformationPanelComponent,
        PlayerRackComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        MatSnackBarModule,
        MatProgressBarModule,
        MatInputModule,
        MatFormFieldModule,
        MatListModule,
        MatSelectModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
