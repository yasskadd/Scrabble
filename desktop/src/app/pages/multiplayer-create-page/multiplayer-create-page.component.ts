import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { TimerService } from '@app/services/timer.service';
import { VirtualPlayersService } from '@app/services/virtual-players.service';

const TIMEOUT = 3000;

const enum TimeOptions {
    ThirtySecond = 30,
    OneMinute = 60,
    OneMinuteAndThirty = 90,
    TwoMinute = 120,
    TwoMinuteAndThirty = 150,
    ThreeMinute = 180,
    ThreeMinuteAndThirty = 210,
    FourMinute = 240,
    FourMinuteAndThirty = 270,
    FiveMinute = 300,
}

@Component({
    selector: 'app-multiplayer-create-page',
    templateUrl: './multiplayer-create-page.component.html',
    styleUrls: ['./multiplayer-create-page.component.scss'],
})
export class MultiplayerCreatePageComponent implements OnInit {
    @ViewChild('info', { static: false }) info: ElementRef;
    @ViewChild('file', { static: false }) file: ElementRef;

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
        public timer: TimerService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private fb: FormBuilder,
        private readonly httpHandler: HttpHandlerService,
        private renderer: Renderer2,
        private snackBar: MatSnackBar,
    ) {
        this.gameMode = this.activatedRoute.snapshot.params.id;
        this.playerName = '';
        this.timerList = [
            TimeOptions.ThirtySecond,
            TimeOptions.OneMinute,
            TimeOptions.OneMinuteAndThirty,
            TimeOptions.TwoMinute,
            TimeOptions.TwoMinuteAndThirty,
            TimeOptions.ThreeMinute,
            TimeOptions.ThreeMinuteAndThirty,
            TimeOptions.FourMinute,
            TimeOptions.FourMinuteAndThirty,
            TimeOptions.FiveMinute,
        ];
        this.botName = '';
        this.difficultyList = ['Débutant', 'Expert'];
        this.selectedFile = null;
    }

    ngOnInit(): void {
        this.virtualPlayers.getBotNames();
        this.gameConfiguration.resetRoomInformation();
        const defaultTimer = this.timerList.find((timerOption) => timerOption === TimeOptions.OneMinute);
        this.form = this.fb.group({
            timer: [defaultTimer, Validators.required],
            difficultyBot: [this.difficultyList[0], Validators.required],
            dictionary: ['Mon dictionnaire', Validators.required],
        });
        (this.form.get('difficultyBot') as AbstractControl).valueChanges.subscribe(() => {
            this.updateBotList();
        });
        this.updateBotList();
        this.httpHandler.getDictionaries().subscribe((dictionaries) => (this.dictionaryList = dictionaries));
    }

    onMouseOver(dictionary: DictionaryInfo) {
        this.info.nativeElement.children[0].textContent = dictionary.title;
        this.info.nativeElement.children[1].textContent = dictionary.description;
        this.renderer.setStyle(this.info.nativeElement, 'visibility', 'visible');
    }

    onMouseOut() {
        this.renderer.setStyle(this.info.nativeElement, 'visibility', 'hidden');
    }

    onOpen() {
        this.httpHandler.getDictionaries().subscribe((dictionaries) => (this.dictionaryList = dictionaries));
    }

    giveNameToBot(): void {
        if (this.isSoloMode()) {
            this.createBotName();
        }
    }

    async createGame(): Promise<void> {
        const dictionnaryTitleSelected = (this.form.get('dictionary') as AbstractControl).value;

        if (!this.dictionaryAvailable(dictionnaryTitleSelected)) {
            this.openSnackBar("Le dictionnaire n'est plus disponible. Veuillez en choisir un autre");
            return;
        }
        const dictionaryTitle = this.getDictionary((this.form.get('dictionary') as AbstractControl).value).title;
        if (await this.dictionaryIsInDB(dictionaryTitle)) {
            if (this.isSoloMode()) this.validateName();
            this.gameConfiguration.gameInitialization({
                username: this.playerName,
                timer: (this.form.get('timer') as AbstractControl).value,
                dictionary: dictionaryTitle,
                mode: this.gameMode,
                isMultiplayer: this.isSoloMode() ? false : true,
                opponent: this.isSoloMode() ? this.botName : undefined,
                botDifficulty: this.isSoloMode() ? (this.form.get('difficultyBot') as AbstractControl).value : undefined,
            });
            this.resetInput();
            this.navigatePage();
            return;
        }
        this.openSnackBar("Le dictionnaire n'est plus disponible. Veuillez en choisir un autre");
    }

    navigatePage() {
        if (this.isSoloMode()) this.router.navigate(['/game']);
        else this.router.navigate([`/multijoueur/salleAttente/${this.gameMode}`]);
    }

    isSoloMode() {
        if (this.router.url === `/solo/${this.gameMode}`) return true;
        return false;
    }

    createBotName(): void {
        this.botName =
            (this.form.get('difficultyBot') as AbstractControl).value === 'Débutant'
                ? this.virtualPlayers.beginnerBotNames[Math.floor(Math.random() * this.virtualPlayers.beginnerBotNames.length)].username
                : this.virtualPlayers.expertBotNames[Math.floor(Math.random() * this.virtualPlayers.expertBotNames.length)].username;
    }

    dictionaryAvailable(dictionaryTitle: string): boolean {
        return this.dictionaryList.some((dictionaryList) => dictionaryList.title === dictionaryTitle);
    }

    private openSnackBar(reason: string): void {
        this.snackBar.open(reason, 'fermer', {
            duration: TIMEOUT,
            verticalPosition: 'top',
        });
    }
    private resetInput(): void {
        this.playerName = '';
    }

    private validateName(): void {
        while (this.playerName.toLowerCase() === this.botName) {
            this.createBotName();
        }
    }

    private getDictionary(title: string): DictionaryInfo {
        if (this.selectedFile !== null) return this.selectedFile;
        return this.dictionaryList.find((dictionary) => dictionary.title === title) as DictionaryInfo;
    }

    private updateBotList(): void {
        this.virtualPlayers.getBotNames().then(() => this.giveNameToBot());
    }

    private async dictionaryIsInDB(title: string): Promise<boolean> {
        return this.httpHandler
            .getDictionaries()
            .toPromise()
            .then((dictionaries) => {
                this.dictionaryList = dictionaries;
                if (dictionaries.some((dictionary) => dictionary.title === title)) return true;
                return false;
            });
    }
}
