import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Bot } from '@app/interfaces/bot';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HighScores } from '@app/interfaces/high-score-parameters';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

type BotNameInfo = { currentName: string; newName: string; difficulty: string };

@Injectable({
    providedIn: 'root',
})
export class HttpHandlerService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    getClassicHighScore(): Observable<HighScores[]> {
        return this.http
            .get<HighScores[]>(`${this.baseUrl}/highScore/classique`)
            .pipe(catchError(this.handleError<HighScores[]>('getClassicHighScore', [])));
    }

    getLOG2990HighScore(): Observable<HighScores[]> {
        return this.http
            .get<HighScores[]>(`${this.baseUrl}/highScore/log2990`)
            .pipe(catchError(this.handleError<HighScores[]>('getLOG2990cHighScore', [])));
    }

    resetHighScores(): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/highScore/reset`).pipe(catchError(this.handleError<void>('resetHighScores')));
    }

    getHistory(): Observable<GameHistoryInfo[]> {
        return this.http.get<GameHistoryInfo[]>(`${this.baseUrl}/history`).pipe(catchError(this.handleError<GameHistoryInfo[]>('getHistory', [])));
    }

    deleteHistory(): Observable<GameHistoryInfo[]> {
        return this.http.delete<GameHistoryInfo[]>(`${this.baseUrl}/history`).pipe(catchError(this.handleError<GameHistoryInfo[]>('getHistory', [])));
    }

    getDictionaries(): Observable<DictionaryInfo[]> {
        return this.http
            .get<DictionaryInfo[]>(`${this.baseUrl}/dictionary/info`)
            .pipe(catchError(this.handleError<DictionaryInfo[]>('getDictionaries', [])));
    }

    getDictionary(title: string): Observable<Dictionary> {
        return this.http.get<Dictionary>(`${this.baseUrl}/dictionary/all/` + title).pipe(catchError(this.handleError<Dictionary>('getDictionaries')));
    }

    resetDictionaries(): Observable<Dictionary[]> {
        return this.http.delete<Dictionary[]>(`${this.baseUrl}/dictionary`).pipe(catchError(this.handleError<Dictionary[]>('getDictionaries', [])));
    }

    deleteDictionary(dictionaryTitle: string): Observable<void> {
        return this.http
            .patch<void>(`${this.baseUrl}/dictionary`, { title: dictionaryTitle })
            .pipe(catchError(this.handleError<void>('deleteDictionary')));
    }

    addDictionary(dictionary: Dictionary): Observable<void> {
        return this.http
            .post<void>(`${this.baseUrl}/dictionary`, {
                title: dictionary.title,
                description: dictionary.description,
                words: dictionary.words,
            })
            .pipe(catchError(this.handleError<void>('addDictionary')));
    }

    // Reason: the server does't really return something but just a status code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionaryIsInDb(title: string): Observable<any> {
        return (
            this.http
                // Reason: the server does't really return something but just a status code
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .get<any>(`${this.baseUrl}/dictionary/dictionaryisindb/${title}`, { observe: 'response' })
                // Reason: the server does't really return something but just a status code
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .pipe(catchError(this.handleError<any>('dictionaryIsInDb')))
        );
    }

    modifyDictionary(dictionary: ModifiedDictionaryInfo): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/dictionary`, dictionary).pipe(catchError(this.handleError<void>('updateDictionary')));
    }

    getBeginnerBots(): Observable<Bot[]> {
        return this.http.get<Bot[]>(`${this.baseUrl}/virtualPlayer/beginner`).pipe(catchError(this.handleError<Bot[]>('getBotsBeginner', [])));
    }

    getExpertBots(): Observable<Bot[]> {
        return this.http.get<Bot[]>(`${this.baseUrl}/virtualPlayer/expert`).pipe(catchError(this.handleError<Bot[]>('getBotsExpert', [])));
    }

    addBot(bot: Bot): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/virtualPlayer`, bot).pipe(catchError(this.handleError<void>('addBot')));
    }

    replaceBot(bot: BotNameInfo): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/virtualPlayer`, bot).pipe(catchError(this.handleError<void>('replaceBot')));
    }

    resetBot(): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/virtualPlayer/reset`).pipe(catchError(this.handleError<void>('resetBot')));
    }

    deleteBot(bot: Bot): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/virtualPlayer/remove`, bot).pipe(catchError(this.handleError<void>('deleteBot')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
