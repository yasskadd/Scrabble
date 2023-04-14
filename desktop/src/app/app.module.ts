import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogGameHelpComponent } from '@app/components/dialog-game-help/dialog-game-help.component';
import { HighScoresComponent } from '@app/components/high-scores/high-scores.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxCaptchaModule } from 'ngx-captcha';
import { CookieModule } from 'ngx-cookie';
import { AdminDictionariesComponent } from './components/admin-dictionaries/admin-dictionaries.component';
import { AdminGameHistoryComponent } from './components/admin-game-history/admin-game-history.component';
import { AdminHighScoresComponent } from './components/admin-high-scores/admin-high-scores.component';
import { AdminVirtualPlayersComponent } from './components/admin-virtual-players/admin-virtual-players.component';
import { GenericChatComponent } from './components/chat/generic-chat/generic-chat.component';
import { ChatboxComponent } from './components/chatbox/chatbox.component';
import { DialogBoxAbandonGameComponent } from './components/dialog-box-abandon-game/dialog-box-abandon-game.component';
import { DialogBoxAvatarSelectorComponent } from './components/dialog-box-avatar-selector/dialog-box-avatar-selector.component';
import { DialogBoxGameTypeComponent } from './components/dialog-box-game-type/dialog-box-game-type.component';
import { DialogBoxHighScoresComponent } from './components/dialog-box-high-scores/dialog-box-high-scores.component';
import { DialogBoxLetterSelectorComponent } from './components/dialog-box-letter-selector/dialog-box-letter-selector.component';
import { DialogBoxModifyBotNamesComponent } from './components/dialog-box-modify-bot-names/dialog-box-modify-bot-names.component';
import { DialogBoxModifyDictionaryComponent } from './components/dialog-box-modify-dictionary/dialog-box-modify-dictionary.component';
import { DialogBoxPasswordComponent } from './components/dialog-box-password/dialog-box-password.component';
import { FooterComponent } from './components/footer/footer.component';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { HeaderComponent } from './components/header/header.component';
import { ImportDictionaryComponent } from './components/import-dictionary/import-dictionary.component';
import { InformationPanelComponent } from './components/information-panel/information-panel.component';
import { PlayerRackComponent } from './components/player-rack/player-rack.component';
import { ErrorSnackBarComponent } from './components/snack-bar/error/error-snack-bar.component';
import { InfoSnackBarComponent } from './components/snack-bar/info/info-snack-bar.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { ConnectionPageComponent } from './pages/connection-page/connection-page.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { GameCreationPageComponent } from './pages/multiplayer-create-page/game-creation-page.component';
import { MultiplayerJoinPageComponent } from './pages/multiplayer-join-page/multiplayer-join-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { UserCreationPageComponent } from './pages/user-creation-page/user-creation-page.component';
import { UserProfilePageComponent } from './pages/user-profile-page/user-profile-page.component';
import { WaitingOpponentPageComponent } from './pages/waiting-opponent-page/waiting-opponent-page.component';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const HttpLoaderFactory = (http: HttpClient) => new TranslateHttpLoader(http, '../assets/i18n/', '.json');

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
        PlayAreaComponent,
        MultiplayerJoinPageComponent,
        GameCreationPageComponent,
        WaitingOpponentPageComponent,
        ChatboxComponent,
        DialogBoxGameTypeComponent,
        InformationPanelComponent,
        PlayerRackComponent,
        DialogBoxAbandonGameComponent,
        DialogBoxHighScoresComponent,
        AdminPageComponent,
        AdminDictionariesComponent,
        AdminVirtualPlayersComponent,
        AdminGameHistoryComponent,
        DialogBoxModifyDictionaryComponent,
        AdminHighScoresComponent,
        DialogBoxModifyBotNamesComponent,
        HeaderComponent,
        FooterComponent,
        DialogGameHelpComponent,
        HighScoresComponent,
        ImportDictionaryComponent,
        UserCreationPageComponent,
        GenericChatComponent,
        ErrorSnackBarComponent,
        InfoSnackBarComponent,
        DialogBoxAvatarSelectorComponent,
        ConnectionPageComponent,
        SettingsPageComponent,
        GameBoardComponent,
        DialogBoxPasswordComponent,
        UserProfilePageComponent,
        DialogBoxLetterSelectorComponent,
    ],
    imports: [
        CommonModule,
        CookieModule.withOptions(),
        AppMaterialModule,
        AppRoutingModule,
        DragDropModule,
        MatSnackBarModule,
        MatInputModule,
        MatTabsModule,
        MatFormFieldModule,
        MatListModule,
        MatSelectModule,
        NgxCaptchaModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        MatProgressSpinnerModule,
        MatStepperModule,
        MatAutocompleteModule,
        MatSidenavModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
            defaultLanguage: 'fr',
        }),
    ],
    providers: [ImportDictionaryComponent],
    bootstrap: [AppComponent],
})
export class AppModule {}
