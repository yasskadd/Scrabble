import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Bot } from '@app/interfaces/bot';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HighScores } from '@app/interfaces/high-score-parameters';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { HttpHandlerService } from './http-handler.service';

describe('HttpHandlerService', () => {
    let service: HttpHandlerService;
    let httpMock: HttpTestingController;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
        service = TestBed.inject(HttpHandlerService);
        httpMock = TestBed.inject(HttpTestingController);
        // Reason : baseUrl is private and we need access for the test
        // eslint-disable-next-line dot-notation
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return expected highScoreClassique list (HttpClient called once)', () => {
        const expectedMessage: HighScores[] = [{ _id: '245isfdhhsdf', username: 'Vincent', type: 'classique', score: 20, position: 1 }];
        service.getClassicHighScore().subscribe((response: HighScores[]) => {
            expect(response).toEqual(expectedMessage);
        }, fail);

        const req = httpMock.expectOne(`${baseUrl}/highScore/classique`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedMessage);
    });

    it('should return expected history list (HttpClient called once)', () => {
        const expectedMessage: GameHistoryInfo[] = [
            {
                firstPlayerName: 'Vincent',
                secondPlayerName: 'Maidenless',
                mode: 'classique',
                firstPlayerScore: 20,
                secondPlayerScore: 0,
                abandoned: true,
                beginningTime: new Date(),
                endTime: new Date(),
                duration: 'Too big',
            },
        ];
        service.getHistory().subscribe((response: GameHistoryInfo[]) => {
            expect(response).toEqual(expectedMessage);
        }, fail);
        const req = httpMock.expectOne(`${baseUrl}/history`);

        expect(req.request.method).toBe('GET');
        req.flush(expectedMessage);
    });

    it('should delete history list (HttpClient called once)', () => {
        // Reason : we don't want the function to do anything for test
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        service.deleteHistory().subscribe(() => {}, fail);

        const req = httpMock.expectOne(`${baseUrl}/history`);
        expect(req.request.method).toBe('DELETE');

        req.flush({}, { status: 204, statusText: 'NO CONTENT' });
    });

    it('should delete high scores list (HttpClient called once)', () => {
        // Reason : we don't want the function to do anything for test
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        service.resetHighScores().subscribe(() => {}, fail);

        const req = httpMock.expectOne(`${baseUrl}/highScore/reset`);
        expect(req.request.method).toBe('DELETE');

        req.flush({}, { status: 204, statusText: 'NO CONTENT' });
    });

    it('should return expected highScoreLOG2990 list (HttpClient called once)', () => {
        const expectedMessage: HighScores[] = [{ _id: '245isfdhhsdf', username: 'Vincent', type: 'LOG2990', score: 50, position: 1 }];

        service.getLOG2990HighScore().subscribe((response: HighScores[]) => {
            expect(response).toEqual(expectedMessage);
        }, fail);

        const req = httpMock.expectOne(`${baseUrl}/highScore/log2990`);
        expect(req.request.method).toBe('GET');

        req.flush(expectedMessage);
    });

    describe('Dictionary tests', () => {
        it('should return expected dictionaries list (HttpClient called once)', () => {
            const expectedMessage: Dictionary[] = [{ title: 'Mon dictionnaire', description: 'Une description', words: ['string'] }];

            service.getDictionaries().subscribe((dictionaries: DictionaryInfo[]) => {
                expect(dictionaries).toEqual(expectedMessage);
            }, fail);

            const req = httpMock.expectOne(`${baseUrl}/dictionary/info`);
            expect(req.request.method).toBe('GET');

            req.flush(expectedMessage);
        });

        it('should not return any message when sending a POST request (HttpClient called once)', () => {
            const sentMessage: Dictionary = { title: 'Mon dictionnaire', description: 'Une description', words: ['string'] };
            // Reason : subscribe to the mocked call
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- We explicitly need an empty function
            service.addDictionary(sentMessage).subscribe(() => {}, fail);
            const req = httpMock.expectOne(`${baseUrl}/dictionary`);
            expect(req.request.method).toBe('POST');

            req.flush(sentMessage);
        });

        it('should not return any message when sending a POST request (HttpClient called once)', () => {
            const expectedMessage: Dictionary = { title: 'BIG_BOI', description: 'Une description', words: ['string'] };
            // Reason : subscribe to the mocked call
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- We explicitly need an empty function
            service.getDictionary('BIG_BOI').subscribe((dictionary) => {
                expect(dictionary).toEqual(expectedMessage);
            }, fail);
            const req = httpMock.expectOne(`${baseUrl}/dictionary/all/BIG_BOI`);
            expect(req.request.method).toBe('GET');

            req.flush(expectedMessage);
        });

        it('should not return any message when sending a POST request (HttpClient called once)', () => {
            const sentMessage: Bot = { username: 'Vincent', difficulty: 'Expert' };
            // Reason : subscribe to the mocked call
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- We explicitly need an empty function
            service.addBot(sentMessage).subscribe(() => {}, fail);
            const req = httpMock.expectOne(`${baseUrl}/virtualPlayer`);
            expect(req.request.method).toBe('POST');

            req.flush(sentMessage);
        });

        it('should expect to return the status when to call dictionaryIsInDb', () => {
            const title = 'BIG_BOI';
            // Reason : we don't want the function to do anything for test
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            service.dictionaryIsInDb(title).subscribe(() => {}, fail);
            const req = httpMock.expectOne(`${baseUrl}/dictionary/dictionaryisindb/${title}`);
            expect(req.request.method).toBe('GET');

            req.flush({});
        });

        it('should not return any message when sending a Put request (HttpClient called once)', () => {
            const sentMessage = { title: 'facile', newTitle: 'expert', newDescription: 'Expert Dictionary' };
            // Reason : subscribe to the mocked call
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- We explicitly need an empty function
            service.modifyDictionary(sentMessage).subscribe(() => {}, fail);
            const req = httpMock.expectOne(`${baseUrl}/dictionary`);
            expect(req.request.method).toBe('PUT');

            req.flush(sentMessage);
        });

        it('should reset dictionary list (HttpClient called once)', () => {
            // Reason : we don't want the function to do anything for test
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            service.resetDictionaries().subscribe(() => {}, fail);

            const req = httpMock.expectOne(`${baseUrl}/dictionary`);
            expect(req.request.method).toBe('DELETE');

            req.flush({}, { status: 204, statusText: 'NO CONTENT' });
        });

        it('should not return any message when sending a patch request (HttpClient called once)', () => {
            const sentMessage = 'facile';
            // Reason : subscribe to the mocked call
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- We explicitly need an empty function
            service.deleteDictionary(sentMessage).subscribe(() => {}, fail);
            const req = httpMock.expectOne(`${baseUrl}/dictionary`);
            expect(req.request.method).toBe('PATCH');

            req.flush(sentMessage);
        });
    });

    describe('Bot tests', () => {
        it('should return expected BeginnerBot list (HttpClient called once)', () => {
            const expectedMessage: Bot[] = [{ username: 'Vincent', difficulty: 'debutant' }];

            service.getBeginnerBots().subscribe((response: Bot[]) => {
                expect(response).toEqual(expectedMessage);
            }, fail);

            const req = httpMock.expectOne(`${baseUrl}/virtualPlayer/beginner`);
            expect(req.request.method).toBe('GET');

            req.flush(expectedMessage);
        });

        it('should return expected ExpertBot list (HttpClient called once)', () => {
            const expectedMessage: Bot[] = [{ username: 'Vincent', difficulty: 'Expert' }];

            service.getExpertBots().subscribe((response: Bot[]) => {
                expect(response).toEqual(expectedMessage);
            }, fail);

            const req = httpMock.expectOne(`${baseUrl}/virtualPlayer/expert`);
            expect(req.request.method).toBe('GET');

            req.flush(expectedMessage);
        });

        it('should return the dictionary requested (HttpClient called once)', () => {
            const sentMessage: Bot = { username: 'Vincent', difficulty: 'Expert' };
            // Reason : subscribe to the mocked call
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- We explicitly need an empty function
            service.addBot(sentMessage).subscribe(() => {}, fail);
            const req = httpMock.expectOne(`${baseUrl}/virtualPlayer`);
            expect(req.request.method).toBe('POST');

            req.flush(sentMessage);
        });

        it('should not return any message when sending a Put request (HttpClient called once)', () => {
            const sentMessage = { currentName: 'Vincent', newName: 'Laure', difficulty: 'Expert' };
            // Reason : subscribe to the mocked call
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- We explicitly need an empty function
            service.replaceBot(sentMessage).subscribe(() => {}, fail);
            const req = httpMock.expectOne(`${baseUrl}/virtualPlayer`);
            expect(req.request.method).toBe('PUT');

            req.flush(sentMessage);
        });

        it('should not return any message when sending a patch request (HttpClient called once)', () => {
            const sentMessage: Bot = { username: 'Vincent', difficulty: 'Expert' };
            // Reason : subscribe to the mocked call
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- We explicitly need an empty function
            service.deleteBot(sentMessage).subscribe(() => {}, fail);
            const req = httpMock.expectOne(`${baseUrl}/virtualPlayer/remove`);
            expect(req.request.method).toBe('PATCH');

            req.flush(sentMessage);
        });

        it('should reset botName list (HttpClient called once)', () => {
            // Reason : we don't want the function to do anything for test
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            service.resetBot().subscribe(() => {}, fail);

            const req = httpMock.expectOne(`${baseUrl}/virtualPlayer/reset`);
            expect(req.request.method).toBe('DELETE');

            req.flush({}, { status: 204, statusText: 'NO CONTENT' });
        });

        it('should handle http error safely', () => {
            service.getLOG2990HighScore().subscribe((response: HighScores[]) => {
                expect(response).toEqual([]);
            }, fail);

            const req = httpMock.expectOne(`${baseUrl}/highScore/log2990`);
            expect(req.request.method).toBe('GET');
            req.error(new ErrorEvent('Random error occurred'));
        });
    });
});
