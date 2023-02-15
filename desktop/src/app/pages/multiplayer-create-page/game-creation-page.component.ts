import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { TimeService } from '@services/time.service';
import { VirtualPlayersService } from '@app/services/virtual-players.service';
import { GameTimeOptions } from '@common/models/game-time-options';
import { GameDifficulty } from '@common/models/game-difficulty';
import { SNACKBAR_TIMEOUT } from '@common/constants/ui-events';
import { AppRoutes } from '@app/models/app-routes';

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
        private snackBar: MatSnackBar,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
        this.playerName = '';
        this.selectedFile = null;
        this.timerList = [];

        // Fill arrays of values from enum constants
        this.difficultyList = Object.values(GameDifficulty);
        Object.values(GameTimeOptions).forEach((value: any) => {
            if (typeof value === 'number') {
                this.timerList.push(value);
            }
        });
    }

    ngOnInit(): void {
        this.virtualPlayers.getBotNames();
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
            this.openSnackBar("Le dictionnaire n'est plus disponible. Veuillez en choisir un autre");
            return;
        }

        const dictionaryTitle = this.getDictionary((this.form.get('dictionary') as AbstractControl).value).title;

        this.httpHandler.getDictionaries().subscribe((dictionaries: DictionaryInfo[]) => {
            this.dictionaryList = dictionaries;
            if (dictionaries.some((dictionary) => dictionary.title === dictionaryTitle)) {
                this.initGame(dictionaryTitle);
                this.navigateToGamePage();
            } else {
                this.openSnackBar("Le dictionnaire n'est plus disponible. Veuillez en choisir un autre");
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

    private openSnackBar(reason: string): void {
        // TODO : Language
        this.snackBar.open(reason, 'Fermer', {
            duration: SNACKBAR_TIMEOUT,
            verticalPosition: 'top',
        });
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
        this.virtualPlayers.getBotNames().then(() => this.giveNameToBot());
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
