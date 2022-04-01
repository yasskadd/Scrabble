/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
// eslint-disable-next-line max-classes-per-file
import { Location } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, Renderer2, Type } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Dictionary } from '@app/interfaces/dictionary';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { DictionaryVerificationService } from '@app/services/dictionary-verification.service';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { of } from 'rxjs';
import { MultiplayerCreatePageComponent } from './multiplayer-create-page.component';

@Component({
    template: '',
})
export class StubComponent {}

const MULTIPLAYER_WAITING_ROOM_ROUTE = 'multijoueur/salleAttente/classique';
const SOLO_MODE = 'solo/classique';
const CREATE_MULTIPLAYER_GAME = 'multijoueur/creer/classique';
const RETURN_ROUTE = 'home';
const GAME_ROUTE = 'game';
const DB_DICTIONARY = { _id: '932487fds', title: 'Mon dictionnaire', description: 'Un dictionnaire', words: ['string'] };

describe('MultiplayerCreatePageComponent', () => {
    let component: MultiplayerCreatePageComponent;
    let fixture: ComponentFixture<MultiplayerCreatePageComponent>;
    let location: Location;
    let router: Router;
    let gameConfigurationServiceSpy: jasmine.SpyObj<GameConfigurationService>;
    let httpHandlerSpy: jasmine.SpyObj<HttpHandlerService>;
    let dictionaryVerificationSpy: jasmine.SpyObj<DictionaryVerificationService>;
    let renderer2: Renderer2;
    let setStyleSpy: unknown;

    const mockMatSnackBar = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        open: () => {},
    };

    beforeEach(async () => {
        gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', [
            'gameInitialization',
            'resetRoomInformation',
            'beginScrabbleGame',
        ]);

        httpHandlerSpy = jasmine.createSpyObj('HttpHandlerService', ['getDictionaries', 'addDictionary']);
        httpHandlerSpy.getDictionaries.and.returnValue(of([DB_DICTIONARY]));
        httpHandlerSpy.addDictionary.and.returnValue(of({} as unknown as void));

        dictionaryVerificationSpy = jasmine.createSpyObj('DictionaryVerificationService', ['globalVerification']);
        await TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                BrowserAnimationsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatOptionModule,
                MatIconModule,
                MatCardModule,
                FormsModule,
                ReactiveFormsModule,
                RouterTestingModule.withRoutes([
                    { path: MULTIPLAYER_WAITING_ROOM_ROUTE, component: StubComponent },
                    { path: RETURN_ROUTE, component: StubComponent },
                    { path: SOLO_MODE, component: StubComponent },
                    { path: CREATE_MULTIPLAYER_GAME, component: StubComponent },
                    { path: GAME_ROUTE, component: StubComponent },
                ]),
            ],

            declarations: [MultiplayerCreatePageComponent],
            providers: [
                { provide: GameConfigurationService, useValue: gameConfigurationServiceSpy },
                { provide: MatSnackBar, useValue: mockMatSnackBar },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: {
                                id: 'classique',
                            },
                        },
                    },
                },
                { provide: FormBuilder },
                { provide: Renderer2 },
                { provide: HttpHandlerService, useValue: httpHandlerSpy },
                { provide: DictionaryVerificationService, useValue: dictionaryVerificationSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(MultiplayerCreatePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        location = TestBed.inject(Location);
        renderer2 = fixture.componentRef.injector.get<Renderer2>(Renderer2 as Type<Renderer2>);
        setStyleSpy = spyOn(renderer2, 'setStyle').and.callThrough();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('uploadDictionary() should call updateImportMessage if file did not pass globalVerification of DictionaryVerificationService', () => {
    //     const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
    //     const dT = new DataTransfer();
    //     dT.items.add(new File([blob], 'test.json'));
    //     component.file.nativeElement.files = dT.files;
    //     dictionaryVerificationSpy.globalVerification.and.callFake(() => 'Did not passed');
    //     component.uploadDictionary();
    //     expect(httpHandlerSpy.addDictionary).toHaveBeenCalled();
    // });

    // it('uploadDictionary() should set selectedFile to file selected if it passed globalVerification of DictionaryVerificationService', () => {
    //     const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
    //     const dT = new DataTransfer();
    //     dT.items.add(new File([blob], 'test.json'));
    //     component.file.nativeElement.files = dT.files;
    //     dictionaryVerificationSpy.globalVerification.and.callFake(() => 'Passed');
    //     component.uploadDictionary();
    //     expect(component.selectedFile).toEqual(DB_DICTIONARY);
    // });

    it('uploadDictionary() should set textContent of fileError with no file selected message if there is no selected file to upload', () => {
        const messageSpy = spyOn(component, 'updateImportMessage');
        component.uploadDictionary();
        expect(messageSpy).toHaveBeenCalledWith("Il n'y a aucun fichier séléctioné", 'red');
    });

    it('clicking on import button should call uploadDictionary()', fakeAsync(() => {
        const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
        const dT = new DataTransfer();
        dT.items.add(new File([blob], 'test.json'));
        component.file.nativeElement.files = dT.files;
        const uploadDictionarySpy = spyOn(component, 'uploadDictionary');
        const button = fixture.debugElement.nativeElement.querySelector('#import');
        button.click();
        tick();
        fixture.detectChanges();
        expect(uploadDictionarySpy).toHaveBeenCalled();
    }));

    it('detectImportFile() should disable dictionary select options if a file has been selected', () => {
        const blob = new Blob([JSON.stringify(DB_DICTIONARY)], { type: 'application/json' });
        const dT = new DataTransfer();
        const disableSpy = spyOn(component.form.controls.dictionary, 'disable');
        dT.items.add(new File([blob], 'test.json'));
        component.file.nativeElement.files = dT.files;
        component.detectImportFile();
        expect(disableSpy).toHaveBeenCalled();
    });

    it('detectImportFile() should set textContent of fileError to nothing', () => {
        const message = '';
        component.detectImportFile();
        expect(component.fileError.nativeElement.textContent).toEqual(message);
    });

    it('selecting a file should call detectImportFile()', fakeAsync(() => {
        const detectImportFileSpy = spyOn(component, 'detectImportFile');
        const input = fixture.debugElement.nativeElement.querySelector('#selectFiles');
        input.dispatchEvent(new Event('change'));
        tick();
        fixture.detectChanges();
        expect(detectImportFileSpy).toHaveBeenCalled();
    }));

    it('updateImportMessage() should set textContent of fileError p with message and text color passed as param', () => {
        const message = 'Message';
        const color = 'red';
        component.updateImportMessage(message, color);
        expect(component.fileError.nativeElement.textContent).toEqual(message);
        expect(component.fileError.nativeElement.style.color).toEqual(color);
    });

    it('onMouseOver() should set textContent of info panel with title and description of the dictionary passed as param', () => {
        component.onMouseOver(DB_DICTIONARY);
        expect(component.info.nativeElement.children[0].textContent).toEqual(DB_DICTIONARY.title);
        expect(component.info.nativeElement.children[1].textContent).toEqual(DB_DICTIONARY.description);
    });

    it('onMouseOver() should call setStyle of Renderer2 and show dictionary info panel', () => {
        component.onMouseOver(DB_DICTIONARY);
        expect(setStyleSpy).toHaveBeenCalledWith(component.info.nativeElement, 'visibility', 'visible');
    });

    it('onMouseOut() should call setStyle of Renderer2 and hide dictionary info panel', () => {
        component.onMouseOut();
        expect(setStyleSpy).toHaveBeenCalledWith(component.info.nativeElement, 'visibility', 'hidden');
    });

    it('onOpen() should call getDictionaries() of HttpHandlerService', () => {
        component.onOpen();
        expect(httpHandlerSpy.getDictionaries).toHaveBeenCalled();
    });

    it('onOpen() should set dictionaryList', () => {
        component.dictionaryList = [];
        component.onOpen();
        expect(component.dictionaryList.length).not.toEqual(0);
    });

    it('navigatePage should redirect to salleAttente when we create a multiplayer Game', fakeAsync(() => {
        const expectedURL = '/' + MULTIPLAYER_WAITING_ROOM_ROUTE;
        component.navigatePage();
        tick();
        fixture.detectChanges();
        expect(location.path()).toEqual(expectedURL);
    }));

    it('navigatePage should redirect to game when we create a solo Game', fakeAsync(() => {
        const expectedURL = '/' + GAME_ROUTE;
        router.navigateByUrl(SOLO_MODE);
        tick();
        component.navigatePage();
        tick();
        fixture.detectChanges();
        expect(location.path()).toEqual(expectedURL);
    }));

    it('using path solo/classique to navigate to this page should return true in the soloMode()', fakeAsync(() => {
        router.navigateByUrl(SOLO_MODE);
        component.isSoloMode();
        tick();
        fixture.detectChanges();
        expect(component.isSoloMode()).toEqual(true);
    }));

    it('using path multijoueur/creer/classique to navigate to this page  should return false in the soloMode()', fakeAsync(() => {
        router.navigateByUrl(CREATE_MULTIPLAYER_GAME);
        component.isSoloMode();
        tick();
        fixture.detectChanges();
        expect(component.isSoloMode()).toEqual(false);
    }));

    it('should have a form with the solo Mode difficulty when we create a solo game', fakeAsync(() => {
        router.navigateByUrl(SOLO_MODE);
        tick();
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('.soloMode');
        expect(form).toBeTruthy();
    }));

    it('should not have a form with the solo Mode difficulty when we create a multiplayer game', fakeAsync(() => {
        router.navigateByUrl(CREATE_MULTIPLAYER_GAME);
        tick();
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('.soloMode');
        expect(form).toBeFalsy();
    }));

    it('returnButton should redirect to home', fakeAsync(() => {
        const button = fixture.debugElement.nativeElement.querySelector('.return-button');
        button.click();
        tick();
        fixture.detectChanges();
        const expectedURL = '/' + RETURN_ROUTE;
        expect(location.path()).toEqual(expectedURL);
    }));

    it('should call createGame() when the start-button is pressed', fakeAsync(() => {
        component.playerName = 'Vincent';
        fixture.detectChanges();
        const spy = spyOn(component, 'createGame');
        const button = fixture.debugElement.nativeElement.querySelector('.start-button');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('createBotName should assign a name to the Expert opponent', fakeAsync(() => {
        router.navigateByUrl(SOLO_MODE);
        tick();
        fixture.detectChanges();
        const difficultySelect = fixture.debugElement.nativeElement.querySelector('#difficulty-select');
        difficultySelect.click();
        tick();
        fixture.detectChanges();
        const difficultyOption = fixture.debugElement.queryAll(By.css('#difficulty-options'));
        difficultyOption[1].nativeElement.click();
        tick();
        fixture.detectChanges();
        flush();
        // eslint-disable-next-line dot-notation
        component['createBotName']();
        expect(component.botName).not.toEqual('');
    }));

    it('createBotName should assign a name to the Beginner opponent', () => {
        // eslint-disable-next-line dot-notation
        component['createBotName']();
        expect(component.botName).not.toEqual('');
    });

    it('should  not call createGame() if the player did not enter his name before trying to click the button', fakeAsync(() => {
        fixture.detectChanges();
        const spy = spyOn(component, 'createGame');
        const button = fixture.debugElement.nativeElement.querySelector('.start-button');
        button.click();
        tick();
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
    }));

    it('giveNameToBot should call createBotName if  we use the path solo/classique to navigate to this page', fakeAsync(() => {
        const spy = spyOn(component, 'createBotName');
        router.navigateByUrl(SOLO_MODE);
        tick();
        component.giveNameToBot();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    }));

    it('giveNameToBot should not call createBotName if  we use the path multijoueur/creer/classique to navigate to this page', fakeAsync(() => {
        const spy = spyOn(component, 'createBotName');
        router.navigateByUrl(CREATE_MULTIPLAYER_GAME);
        tick();
        component.giveNameToBot();
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
    }));

    it('should display 10 timer options when selecting timer', fakeAsync(() => {
        const timerSelect = fixture.debugElement.nativeElement.querySelector('#timer-select');
        timerSelect.click();
        tick();
        fixture.detectChanges();
        const timerOptions = fixture.debugElement.queryAll(By.css('#timer-options'));
        flush();
        expect(timerOptions.length).toEqual(component.timerList.length);
    }));
    it('should set timer to timer option when one is select', fakeAsync(() => {
        const timerSelect = fixture.debugElement.nativeElement.querySelector('#timer-select');
        timerSelect.click();
        tick();
        fixture.detectChanges();
        const timerOptions = fixture.debugElement.queryAll(By.css('#timer-options'));
        timerOptions[3].nativeElement.click();
        tick();
        fixture.detectChanges();
        flush();
        expect(component.form.get('timer')?.value).toEqual(component.timerList[3]);
    }));

    it('should display the timer option selected', fakeAsync(() => {
        const expectedValue = '2:00 minutes';
        const timerSelect = fixture.debugElement.nativeElement.querySelector('#timer-select');
        timerSelect.click();
        tick();
        fixture.detectChanges();
        const timerOptions = fixture.debugElement.queryAll(By.css('#timer-options'));
        timerOptions[3].nativeElement.click();
        tick();
        fixture.detectChanges();
        flush();
        expect(timerSelect.textContent).toEqual(expectedValue);
    }));

    it('createGame should call gameConfiguration.gameInitialization', fakeAsync(() => {
        component.playerName = 'Vincent';
        component.createGame();
        expect(gameConfigurationServiceSpy.gameInitialization).toHaveBeenCalled();
    }));

    it('createGame should call gameConfiguration.gameInitialization with the good Value', fakeAsync(() => {
        component.playerName = 'Vincent';
        const TEST_PLAYER = {
            username: component.playerName,
            timer: 60,
            dictionary: ['francais'],
            mode: 'classique',
            isMultiplayer: true,
            opponent: undefined,
            botDifficulty: undefined,
        };
        component.selectedFile = { words: ['francais'] } as Dictionary;
        component.createGame();
        expect(gameConfigurationServiceSpy.gameInitialization).toHaveBeenCalled();
        expect(gameConfigurationServiceSpy.gameInitialization).toHaveBeenCalledWith(TEST_PLAYER);
    }));

    it('createGame should call gameConfiguration.gameInitialization with the good Value when we create a solo game', fakeAsync(() => {
        component.playerName = 'Vincent';
        component.botName = 'robert';
        const TEST_PLAYER = {
            username: component.playerName,
            timer: 60,
            dictionary: ['francais'],
            mode: 'classique',
            isMultiplayer: false,
            opponent: 'robert',
            botDifficulty: 'Débutant',
        };
        router.navigateByUrl(SOLO_MODE);
        tick();
        fixture.detectChanges();
        component.selectedFile = { words: ['francais'] } as Dictionary;
        component.createGame();
        expect(gameConfigurationServiceSpy.gameInitialization).toHaveBeenCalled();
        expect(gameConfigurationServiceSpy.gameInitialization).toHaveBeenCalledWith(TEST_PLAYER);
    }));

    it('createGame should call navigatePage', fakeAsync(() => {
        const spy = spyOn(component, 'navigatePage');
        component.createGame();

        expect(spy).toHaveBeenCalled();
    }));

    it('createGame should call resetInput', fakeAsync(() => {
        // Testing private method
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn<any>(component, 'resetInput');

        component.createGame();
        expect(spy).toHaveBeenCalled();
    }));

    it('should call giveNameToBot() when the difficulty of the bot change', fakeAsync(() => {
        const spy = spyOn(component, 'giveNameToBot');
        router.navigateByUrl(SOLO_MODE);
        tick();
        fixture.detectChanges();
        const difficultySelect = fixture.debugElement.nativeElement.querySelector('#difficulty-select');
        difficultySelect.click();
        tick();
        fixture.detectChanges();
        const difficultyOption = fixture.debugElement.queryAll(By.css('#difficulty-options'));
        difficultyOption[1].nativeElement.click();
        tick();
        fixture.detectChanges();
        flush();
        component.createGame();
        expect(component.form.get('difficultyBot')?.value).toEqual(component.difficultyList[1]);
        expect(spy).toHaveBeenCalled();
    }));

    it('should call giveNameToBot() two times when the difficulty of the bot change to Expert', fakeAsync(() => {
        const spy = spyOn(component, 'giveNameToBot');
        router.navigateByUrl(SOLO_MODE);
        tick();
        fixture.detectChanges();
        const difficultySelect = fixture.debugElement.nativeElement.querySelector('#difficulty-select');
        difficultySelect.click();
        tick();
        fixture.detectChanges();
        const difficultyOption = fixture.debugElement.queryAll(By.css('#difficulty-options'));
        difficultyOption[1].nativeElement.click();
        tick();
        fixture.detectChanges();
        difficultyOption[0].nativeElement.click();
        tick();
        fixture.detectChanges();
        flush();
        expect(spy).toHaveBeenCalledTimes(2);
    }));

    it('validateName should change the name of the bot if he has the same name as the player', () => {
        const name = 'robert';
        component.playerName = name;
        component.botName = name;
        // eslint-disable-next-line dot-notation
        component['validateName']();
        expect(component.botName).not.toEqual(name);
    });

    it('validateName should not change the name of the bot if he has not the same name as the player', () => {
        const name = 'robert';
        component.playerName = 'Vincent';
        component.botName = name;
        // eslint-disable-next-line dot-notation
        component['validateName']();
        expect(component.botName).toEqual(name);
    });

    it('createGame should not call gameConfiguration.beginScrabbleGame when we create a multiplayer game', fakeAsync(() => {
        component.playerName = 'Vincent';
        router.navigateByUrl(CREATE_MULTIPLAYER_GAME);
        tick();
        fixture.detectChanges();
        component.createGame();
        setTimeout(() => {
            expect(gameConfigurationServiceSpy.beginScrabbleGame).not.toHaveBeenCalled();
        }, 150);
        flush();
    }));

    it('resetInput() should clear the playerName', () => {
        const VALID_NAME = 'Serge';
        component.playerName = VALID_NAME;
        // Testing private method
        // eslint-disable-next-line dot-notation
        component['resetInput']();
        expect(component.playerName).toEqual('');
    });

    it('getDictionary() should return selectedFile if a file has been imported', () => {
        const expectedDictionary = {} as Dictionary;
        component.selectedFile = expectedDictionary;
        // eslint-disable-next-line dot-notation
        expect(component['getDictionary']('title')).toEqual(expectedDictionary);
    });

    it('getDictionary() should return the dictionary matching param title if there is no import file', () => {
        // eslint-disable-next-line dot-notation
        expect(component['getDictionary'](DB_DICTIONARY.title)).toEqual(DB_DICTIONARY);
    });
});
