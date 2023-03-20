import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { GameParameters } from '@app/interfaces/game-parameters';
import { AppRoutes } from '@app/models/app-routes';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { LanguageService } from '@app/services/language.service';
import { TimeService } from '@app/services/time.service';
import { UserService } from '@app/services/user.service';
import { VirtualPlayersService } from '@app/services/virtual-players.service';
import { DictionaryEvents } from '@common/models/dictionary-events';
import { GameDifficulty } from '@common/models/game-difficulty';
import { GameTimeOptions } from '@common/models/game-time-options';
import { SnackBarService } from '@services/snack-bar.service';

@Component({
    selector: 'app-multiplayer-create-page',
    templateUrl: './game-creation-page.component.html',
    styleUrls: ['./game-creation-page.component.scss'],
})
export class GameCreationPageComponent implements OnInit {
    timerList: number[];
    botName: string;
    playerName: string;
    difficultyList: string[];
    dictionaryList: DictionaryInfo[];
    selectedFile: Dictionary | null;

    form: FormGroup;
    passwordEnableForm: FormControl;
    passwordForm: FormControl;
    playerForm: FormControl;
    timerForm: FormControl;
    difficultyForm: FormControl;
    dictionaryForm: FormControl;

    private readonly gameMode: string;

    constructor(
        protected virtualPlayers: VirtualPlayersService,
        protected gameConfiguration: GameConfigurationService,
        protected timer: TimeService,
        protected userService: UserService,
        private languageService: LanguageService,
        private activatedRoute: ActivatedRoute,
        private formBuilder: FormBuilder,
        private router: Router,
        private readonly httpHandler: HttpHandlerService,
        private snackBarService: SnackBarService,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
        this.selectedFile = null;
        this.difficultyList = [];
        this.timerList = [];

        this.passwordEnableForm = new FormControl(false);
        this.passwordForm = new FormControl('');
        this.timerForm = new FormControl('', Validators.required);
        this.difficultyForm = new FormControl('', Validators.required);
        // TODO : Set default dictionary from server
        this.dictionaryForm = new FormControl('Mon dictionnaire', Validators.required);

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

        this.form = this.formBuilder.group({
            password: this.passwordForm,
            timer: this.timerForm,
            difficultyBot: this.difficultyForm,
            dictionary: this.dictionaryForm,
        });

        this.passwordEnableForm.valueChanges.subscribe(() => {
            if (this.passwordEnableForm.value) {
                this.passwordForm.addValidators(Validators.required);
            } else {
                this.passwordForm.removeValidators(Validators.required);
            }
            this.form.setControl('password', this.passwordForm);
        });
    }

    ngOnInit(): void {
        this.virtualPlayers.updateBotNames();
        this.gameConfiguration.resetRoomInformation();

        this.difficultyForm.valueChanges.subscribe(() => {
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

    private getDictionary(title: string): DictionaryInfo {
        if (this.selectedFile !== null) return this.selectedFile;
        return this.dictionaryList.find((dictionary) => dictionary.title === title);
    }

    private updateBotList(): void {
        this.virtualPlayers.updateBotNames().subscribe(() => this.giveNameToBot());
    }

    private initGame(dictionaryTitle: string): void {
        this.gameConfiguration.gameInitialization({
            user: this.userService.user,
            timer: (this.form.get('timer') as AbstractControl).value,
            dictionary: dictionaryTitle,
            mode: this.gameMode,
            isMultiplayer: !this.isSoloMode(),
            opponent: this.isSoloMode() ? this.botName : undefined,
            botDifficulty: this.isSoloMode() ? (this.form.get('difficultyBot') as AbstractControl).value : undefined,
        } as GameParameters);

        this.playerName = '';
    }
}
