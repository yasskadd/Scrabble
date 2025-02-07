import { Component, NgZone, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { AppRoutes } from '@app/models/app-routes';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { LanguageService } from '@app/services/language.service';
import { TimeService } from '@app/services/time.service';
import { UserService } from '@app/services/user.service';
import { VirtualPlayersService } from '@app/services/virtual-players.service';
import { SocketEvents } from '@common/constants/socket-events';
import { GameCreationQuery } from '@common/interfaces/game-creation-query';
import { DictionaryEvents } from '@common/models/dictionary-events';
import { GameDifficulty } from '@common/models/game-difficulty';
import { GameMode } from '@common/models/game-mode';
import { GameTimeOptions } from '@common/models/game-time-options';
import { GameVisibility } from '@common/models/game-visibility';
import { ClientSocketService } from '@services/communication/client-socket.service';
import { SnackBarService } from '@services/snack-bar.service';
import { MatDrawer } from '@angular/material/sidenav';
import { ChatboxHandlerService } from '@services/chat/chatbox-handler.service';

@Component({
    selector: 'app-multiplayer-create-page',
    templateUrl: './game-creation-page.component.html',
    styleUrls: ['./game-creation-page.component.scss'],
})
export class GameCreationPageComponent {
    @ViewChild('drawer') drawer: MatDrawer;
    timerList: number[];
    botName: string;
    playerName: string;
    difficultyList: string[];
    dictionaryList: DictionaryInfo[];
    selectedFile: Dictionary | null;

    passwordEnableForm: FormControl;
    passwordForm: FormControl;
    timerForm: FormControl;
    difficultyForm: FormControl;
    dictionaryForm: FormControl;

    protected isGameLocked: boolean;
    protected isGamePublic: boolean;
    protected chatIsOpen: boolean;

    private readonly gameMode: GameMode;

    constructor(
        protected virtualPlayers: VirtualPlayersService,
        protected gameConfiguration: GameConfigurationService,
        protected chatboxHandler: ChatboxHandlerService,
        protected timer: TimeService,
        protected userService: UserService,
        private clientSocketService: ClientSocketService,
        private languageService: LanguageService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private readonly httpHandler: HttpHandlerService,
        private snackBarService: SnackBarService,
        private ngZone: NgZone,
    ) {
        this.chatIsOpen = false;

        this.chatboxHandler.chatWindowOpened.subscribe((value: boolean) => {
            if (value) {
                this.drawer?.close().then();
            } else {
                this.drawer?.open().then();
            }
        });

        this.gameMode = this.activatedRoute.snapshot.params.id as GameMode;
        this.selectedFile = null;
        this.difficultyList = [];
        this.timerList = [];

        this.passwordEnableForm = new FormControl(false);
        this.passwordForm = new FormControl('');
        this.timerForm = new FormControl('', Validators.required);
        this.difficultyForm = new FormControl('', Validators.required);
        // TODO : Set default dictionary from server
        this.dictionaryForm = new FormControl('Mon dictionnaire', Validators.required);

        this.isGameLocked = false;
        this.isGamePublic = true;

        // Fill arrays of values from enum constants
        Object.values(GameDifficulty).forEach((value: GameDifficulty) => {
            this.languageService.getWord(value as string).subscribe((word: string) => {
                this.difficultyList.push(word);
                this.difficultyForm.setValue(this.difficultyList[0]);
            });
        });
        Object.values(GameTimeOptions).forEach((value: any) => {
            if (typeof value === 'number') {
                this.timerList.push(value);
            }

            const defaultTimer = this.timerList.find((timerOption) => timerOption === GameTimeOptions.OneMinute);
            this.timerForm.setValue(defaultTimer);
        });

        this.virtualPlayers.updateBotNames();
        this.gameConfiguration.resetRoomInformations();

        this.difficultyForm.valueChanges.subscribe(() => {
            this.updateBotList();
        });

        this.updateBotList();
        this.downloadDictionaries();
    }

    openChat() {
        this.chatIsOpen = true;
    }

    closeChat() {
        this.chatIsOpen = false;
    }

    downloadDictionaries() {
        this.httpHandler.getDictionaries().then((dictionaries) => (this.dictionaryList = dictionaries));
    }

    giveNameToBot(): void {
        if (this.isSoloMode()) {
            this.setBotName();
        }
    }

    async createGame(): Promise<void> {
        const dictionnaryTitleSelected = this.dictionaryForm.value;

        if (!this.dictionaryAvailable(dictionnaryTitleSelected)) {
            this.languageService.getWord(DictionaryEvents.UNAVAILABLE).subscribe((word: string) => {
                this.snackBarService.openError(word);
            });
            return;
        }

        const dictionaryTitle = this.getDictionary(this.dictionaryForm.value).title;

        this.httpHandler.getDictionaries().then((dictionaries: DictionaryInfo[]) => {
            this.dictionaryList = dictionaries;
            if (dictionaries.some((dictionary) => dictionary.title === dictionaryTitle)) {
                this.initGame(dictionaryTitle);
                this.navigateToGamePage();
            } else {
                this.snackBarService.openError(DictionaryEvents.UNAVAILABLE);
            }
        });
    }

    navigateToGamePage() {
        if (this.isSoloMode()) {
            this.ngZone.run(() => {
                this.router.navigate([`${AppRoutes.GamePage}`]).then();
            });
        } else {
            this.ngZone.run(() => {
                this.router.navigate([`${AppRoutes.MultiWaitingPage}/${this.gameMode}`]).then();
            });
        }
    }

    isSoloMode() {
        return this.router.url === `/${AppRoutes.SoloGameCreationPage}/${this.gameMode}`;
    }

    setBotName(): void {
        // TODO : Language
        this.botName =
            this.difficultyForm.value === 'Débutant'
                ? this.virtualPlayers.beginnerBotNames[Math.floor(Math.random() * this.virtualPlayers.beginnerBotNames.length)].username
                : this.virtualPlayers.expertBotNames[Math.floor(Math.random() * this.virtualPlayers.expertBotNames.length)].username;
    }

    dictionaryAvailable(dictionaryTitle: string): boolean {
        return this.dictionaryList.some((dictionaryList) => dictionaryList.title === dictionaryTitle);
    }

    isFormInvalid() {
        return this.passwordForm.invalid || this.timerForm.invalid || this.difficultyForm.invalid || this.dictionaryForm.invalid;
    }

    protected clickPasswordToggle(): void {
        this.isGameLocked = !this.isGameLocked;

        if (this.isGameLocked) {
            this.passwordForm.addValidators([Validators.required]);
            this.passwordForm.updateValueAndValidity();
        } else {
            this.passwordForm.removeValidators([Validators.required]);
            this.passwordForm.updateValueAndValidity();
        }
    }

    protected clickVisibilityToggle(): void {
        this.isGamePublic = !this.isGamePublic;
    }

    protected getError(): string {
        if (this.passwordForm.hasError('minlength')) {
            // TODO : Language
            return '8 caractères minimum';
        }

        return '';
    }

    protected redirectHome() {
        this.ngZone.run(() => {
            this.router.navigate([AppRoutes.HomePage]).then();
        });
    }

    private getDictionary(title: string): DictionaryInfo {
        if (this.selectedFile !== null) return this.selectedFile;
        return this.dictionaryList.find((dictionary) => dictionary.title === title);
    }

    private updateBotList(): void {
        this.virtualPlayers.updateBotNames().subscribe(() => this.giveNameToBot());
    }

    private initGame(dictionaryTitle: string): void {
        this.clientSocketService.send(SocketEvents.CreateWaitingRoom, {
            user: this.userService.user,
            timer: this.timerForm.value,
            dictionary: dictionaryTitle,
            mode: this.gameMode,
            botDifficulty:
                Object.values(GameDifficulty)[this.difficultyList.findIndex((difficulty: string) => this.difficultyForm.value === difficulty)],
            visibility: this.isGameLocked ? GameVisibility.Locked : this.isGamePublic ? GameVisibility.Public : GameVisibility.Private,
            password: this.passwordForm.value,
        } as GameCreationQuery);

        this.playerName = '';
    }
}
