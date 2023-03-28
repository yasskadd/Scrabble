import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HighScores } from '@app/interfaces/high-score-parameters';
import { AvatarData } from '@common/interfaces/avatar-data';
import { Bot } from '@common/interfaces/bot';
import { BotNameSwitcher } from '@common/interfaces/bot-name-switcher';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { IUser } from '@common/interfaces/user';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class HttpHandlerService {
    private readonly baseUrl: string = environment.serverUrl;
    private header: HttpHeaders;

    constructor(private readonly http: HttpClient) {}

    getClassicHighScore(): Observable<HighScores[]> {
        return this.http
            .get<HighScores[]>(`${this.baseUrl}/highScore/classique`, { withCredentials: true })
            .pipe(catchError(this.handleError<HighScores[]>('getClassicHighScore', [])));
    }

    getLOG2990HighScore(): Observable<HighScores[]> {
        return this.http
            .get<HighScores[]>(`${this.baseUrl}/highScore/log2990`, { withCredentials: true })
            .pipe(catchError(this.handleError<HighScores[]>('getLOG2990cHighScore', [])));
    }

    resetHighScores(): Observable<void> {
        return this.http
            .delete<void>(`${this.baseUrl}/highScore/reset`, { withCredentials: true })
            .pipe(catchError(this.handleError<void>('resetHighScores')));
    }

    getHistory(): Observable<GameHistoryInfo[]> {
        return this.http
            .get<GameHistoryInfo[]>(`${this.baseUrl}/history`, { withCredentials: true })
            .pipe(catchError(this.handleError<GameHistoryInfo[]>('getHistory', [])));
    }

    deleteHistory(): Observable<GameHistoryInfo[]> {
        return this.http
            .delete<GameHistoryInfo[]>(`${this.baseUrl}/history`, { withCredentials: true })
            .pipe(catchError(this.handleError<GameHistoryInfo[]>('getHistory', [])));
    }

    getDictionaries(): Observable<DictionaryInfo[]> {
        return this.http
            .get<DictionaryInfo[]>(`${this.baseUrl}/dictionary/info`, { withCredentials: true })
            .pipe(catchError(this.handleError<DictionaryInfo[]>('getDictionaries', [])));
    }

    getDictionary(title: string): Observable<Dictionary> {
        return this.http
            .get<Dictionary>(`${this.baseUrl}/dictionary/all/` + title, { withCredentials: true })
            .pipe(catchError(this.handleError<Dictionary>('getDictionaries')));
    }

    resetDictionaries(): Observable<Dictionary[]> {
        return this.http
            .delete<Dictionary[]>(`${this.baseUrl}/dictionary`, { withCredentials: true })
            .pipe(catchError(this.handleError<Dictionary[]>('getDictionaries', [])));
    }

    deleteDictionary(dictionaryTitle: string): Observable<void> {
        return this.http
            .patch<void>(`${this.baseUrl}/dictionary`, { title: dictionaryTitle }, { withCredentials: true })
            .pipe(catchError(this.handleError<void>('deleteDictionary')));
    }

    addDictionary(dictionary: Dictionary): Observable<void> {
        return this.http
            .post<void>(
                `${this.baseUrl}/dictionary`,
                {
                    title: dictionary.title,
                    description: dictionary.description,
                    words: dictionary.words,
                },
                { withCredentials: true },
            )
            .pipe(catchError(this.handleError<void>('addDictionary')));
    }

    dictionaryIsInDb(title: string): Observable<void> {
        return this.http
            .get<void>(`${this.baseUrl}/dictionary/isindb/${title}`, { withCredentials: true })
            .pipe(catchError(this.handleError<void>('dictionaryIsInDb')));
    }

    modifyDictionary(dictionary: ModifiedDictionaryInfo): Observable<void> {
        return this.http
            .put<void>(`${this.baseUrl}/dictionary`, dictionary, { withCredentials: true })
            .pipe(catchError(this.handleError<void>('updateDictionary')));
    }

    getBeginnerBots(): Observable<Bot[]> {
        return this.http
            .get<Bot[]>(`${this.baseUrl}/virtualPlayer/beginner`, { withCredentials: true })
            .pipe(catchError(this.handleError<Bot[]>('getBotsBeginner', [])));
    }

    getExpertBots(): Observable<Bot[]> {
        return this.http
            .get<Bot[]>(`${this.baseUrl}/virtualPlayer/expert`, { withCredentials: true })
            .pipe(catchError(this.handleError<Bot[]>('getBotsExpert', [])));
    }

    addBot(bot: Bot): Observable<void> {
        return this.http
            .post<void>(`${this.baseUrl}/virtualPlayer`, bot, { withCredentials: true })
            .pipe(catchError(this.handleError<void>('addBot')));
    }

    replaceBot(bot: BotNameSwitcher): Observable<void> {
        return this.http
            .put<void>(`${this.baseUrl}/virtualPlayer`, bot, { withCredentials: true })
            .pipe(catchError(this.handleError<void>('replaceBot')));
    }

    resetBot(): Observable<void> {
        return this.http
            .delete<void>(`${this.baseUrl}/virtualPlayer/reset`, { withCredentials: true })
            .pipe(catchError(this.handleError<void>('resetBot')));
    }

    deleteBot(bot: Bot): Observable<void> {
        return this.http
            .patch<void>(`${this.baseUrl}/virtualPlayer/remove`, bot, { withCredentials: true })
            .pipe(catchError(this.handleError<void>('deleteBot')));
    }

    signUp(newUser: IUser): Observable<{ imageKey: string }> {
        return this.http
            .post<{ imageKey: string }>(`${this.baseUrl}/auth/signUp`, newUser)
            .pipe(catchError(this.handleError<{ imageKey: string }>('sign-up')));
    }

    login(user: IUser): Observable<{ userData: IUser; cookie: string }> {
        const httpOptions = {
            withCredentials: true,
        };

        return this.http
            .post<{ userData: IUser; cookie: string }>(`${this.baseUrl}/auth/login`, user, httpOptions)
            .pipe(catchError(this.handleError<{ userData: IUser; cookie: string }>('login')));
    }

    logout(): Observable<any> {
        const header = new HttpHeaders();
        header.append('Content-Type', 'application/json');

        const httpOptions = {
            headers: this.header,
            withCredentials: true,
            observe: 'response' as 'response',
        };

        return this.http.post<void>(`${this.baseUrl}/auth/logout`, null, httpOptions).pipe(catchError(this.handleError<void>('logout')));
    }

    getDefaultImages(): Observable<Map<string, string[]>> {
        const httpOptions = {
            withCredentials: true,
        };

        return this.http
            .get<Map<string, string[]>>(`${this.baseUrl}/image/default-pictures`, httpOptions)
            .pipe(catchError(this.handleError<Map<string, string[]>>('get-default-images')));
    }

    sendProfilePicture(avatarData: AvatarData, imageKey: string): Observable<void> {
        const header = new HttpHeaders();
        header.append('Content-Type', 'multipart/form-data');

        const httpOptions = {
            headers: this.header,
            withCredentials: true,
        };

        // Creation of 2 files because the request only accepts files
        const imageKeyFile = new File([imageKey], 'imageKey', { type: 'text/html' });
        const data = new FormData();
        data.append('data', avatarData.file);
        data.append('imageKey', imageKeyFile);

        return this.http
            .post<void>(`${this.baseUrl}/image/profile-picture`, data, httpOptions)
            .pipe(catchError(this.handleError<void>('send-profile-picture')));
    }

    getProfilePicture(): Observable<{ url: string }> {
        const httpOptions = {
            withCredentials: true,
        };

        return this.http
            .get<{ url: string }>(`${this.baseUrl}/image/profile-picture`, httpOptions)
            .pipe(catchError(this.handleError<{ url: string }>('get-profile-picture')));
    }

    modifyProfilePicture(image: AvatarData, isDefault: boolean): Observable<{ userData: IUser }> {
        if (isDefault) {
            return this.http
                .patch<{ userData: IUser }>(
                    `${this.baseUrl}/image/profile-picture`,
                    { fileName: image.name },
                    {
                        withCredentials: true,
                    },
                )
                .pipe(catchError(this.handleError<{ userData: IUser }>('modify-image-to-default')));
        }

        const header = new HttpHeaders();
        header.append('Content-Type', 'multipart/form-data');

        const data = new FormData();
        data.append('image', image.file);

        return this.http.put<{ userData: IUser }>(`${this.baseUrl}/image/profile-picture`, data, {
            headers: this.header,
            withCredentials: true,
        });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }

    // private throwError<T>(error: HttpErrorResponse): Observable<T> {
    //     return throwError(() => new HttpErrorResponse(error));
    // }
}
