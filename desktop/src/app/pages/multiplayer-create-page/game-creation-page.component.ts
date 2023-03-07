import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { AppRoutes } from '@app/models/app-routes';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { LanguageService } from '@app/services/language.service';
import { VirtualPlayersService } from '@app/services/virtual-players.service';
import { DictionaryEvents } from '@common/models/dictionary-events';
import { GameDifficulty } from '@common/models/game-difficulty';
import { GameTimeOptions } from '@common/models/game-time-options';
import { SnackBarService } from '@services/snack-bar.service';
import { TimeService } from '@services/time.service';

@Component({
    selector: 'app-multiplayer-create-page',
    templateUrl: './game-creation-page.component.html',
    styleUrls: ['./game-creation-page.component.scss'],
})
export class GameCreationPageComponent implements OnInit {
    timerList: number[];
    botName: string;
    playerName: string;
    form: FormGroup;
    difficultyList: string[];
    dictionaryList: DictionaryInfo[];
    selectedFile: Dictionary | null;
    private gameMode: string;

    constructor(
        public virtualPlayers: VirtualPlayersService,
        public gameConfiguration: GameConfigurationService,
        public timer: TimeService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private fb: FormBuilder,
        private readonly httpHandler: HttpHandlerService,
        private snackBarService: SnackBarService,
        private languageService: LanguageService,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
        this.playerName = '';
        this.selectedFile = null;
        this.timerList = [];

        // Fill arrays of values from enum constants
        Object.values(GameDifficulty).forEach((value: GameDifficulty) => {
            this.languageService.getWord(value as string).subscribe((word: string) => {
                this.difficultyList.push(word);
            });
        });
        Object.values(GameTimeOptions).forEach((value: any) => {
            if (typeof value === 'number') {
                this.timerList.push(value);
            }
        });
    }

    ngOnInit(): void {
        this.virtualPlayers.updateBotNames();
        this.gameConfiguration.resetRoomInformation();

        const defaultTimer = this.timerList.find((timerOption) => timerOption === GameTimeOptions.OneMinute);

        this.form = this.fb.group({
            timer: [defaultTimer, Validators.required],
            difficultyBot: [this.difficultyList[0], Validators.required],
            dictionary: ['Mon dictionnaire', Validators.required],
        });
        (this.form.get('difficultyBot') as AbstractControl).valueChanges.subscribe(() => {
            this.updateBotList();
        });

        this.updateBotList();
        this.downloadDictionaries();
    }

    downloadDictionaries() {
        this.httpHandler.getDictionaries().subscribe((dictionaries) => (this.dictionaryList = dictionaries));
    }

    giveNameToBot(): void {
        if (this.isSoloMode()) {
            this.setBotName();
        }
    }

    async createGame(): Promise<void> {
        const dictionnaryTitleSelected = (this.form.get('dictionary') as AbstractControl).value;

        if (!this.dictionaryAvailable(dictionnaryTitleSelected)) {
            // TODO : Language
            this.languageService.getWord(DictionaryEvents.UNAVAILABLE).subscribe((word: string) => {
                this.snackBarService.openError(word);
            });
            return;
        }

        const dictionaryTitle = this.getDictionary((this.form.get('dictionary') as AbstractControl).value).title;

        this.httpHandler.getDictionaries().subscribe((dictionaries: DictionaryInfo[]) => {
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
        if (this.isSoloMode()) this.router.navigate([AppRoutes.GamePage]).then();
        else this.router.navigate([`${AppRoutes.MultiWaitingPage}/${this.gameMode}`]).then();
    }

    isSoloMode() {
        return this.router.url === `/${AppRoutes.SoloGameCreationPage}/${this.gameMode}`;
    }

    setBotName(): void {
        // TODO : Language
        this.botName =
            (this.form.get('difficultyBot') as AbstractControl).value === 'Débutant'
                ? this.virtualPlayers.beginnerBotNames[Math.floor(Math.random() * this.virtualPlayers.beginnerBotNames.length)].username
                : this.virtualPlayers.expertBotNames[Math.floor(Math.random() * this.virtualPlayers.expertBotNames.length)].username;
    }

    dictionaryAvailable(dictionaryTitle: string): boolean {
        return this.dictionaryList.some((dictionaryList) => dictionaryList.title === dictionaryTitle);
    }

    private validateName(): void {
        while (this.playerName.toLowerCase() === this.botName) {
            this.setBotName();
        }
    }

    private getDictionary(title: string): DictionaryInfo {
        if (this.selectedFile !== null) return this.selectedFile;
        return this.dictionaryList.find((dictionary) => dictionary.title === title);
    }

    private updateBotList(): void {
        this.virtualPlayers.updateBotNames().subscribe(() => this.giveNameToBot());
    }

    private initGame(dictionaryTitle: string): void {
        if (this.isSoloMode()) this.validateName();
        this.gameConfiguration.gameInitialization({
            username: this.playerName,
            timer: (this.form.get('timer') as AbstractControl).value,
            dictionary: dictionaryTitle,
            mode: this.gameMode,
            isMultiplayer: !this.isSoloMode(),
            opponent: this.isSoloMode() ? this.botName : undefined,
            botDifficulty: this.isSoloMode() ? (this.form.get('difficultyBot') as AbstractControl).value : undefined,
        });
        this.playerName = '';
    }
}
