import { Injectable } from '@angular/core';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryInfo } from '@app/interfaces/dictionary-info';
import { HighScores } from '@app/interfaces/high-score-parameters';
import { AvatarData } from '@common/interfaces/avatar-data';
import { Bot } from '@common/interfaces/bot';
import { BotNameSwitcher } from '@common/interfaces/bot-name-switcher';
import { ChatRoomUser } from '@common/interfaces/chat-room';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { HistoryEvent } from '@common/interfaces/history-event';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { Theme } from '@common/interfaces/theme';
import { IUser } from '@common/interfaces/user';
import { TopRanker, UserStats } from '@common/interfaces/user-stats';
import { fs, invoke } from '@tauri-apps/api';
import { environment } from 'src/environments/environment';

export interface HttpResponse {
    body: string;
}

@Injectable({
    providedIn: 'root',
})
export class HttpHandlerService {
    private readonly baseUrl: string = environment.serverUrl;

    async getClassicHighScore(): Promise<HighScores[]> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/highScore/classique` });

        return JSON.parse(res.body);
    }

    async getLOG2990HighScore(): Promise<HighScores[]> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/highScore/log2990` });

        return JSON.parse(res.body);
    }

    async resetHighScores(): Promise<void> {
        const res: HttpResponse = await invoke('httpDelete', { url: `${this.baseUrl}/highScore/reset` });

        return JSON.parse(res.body);
    }

    async getHistory(): Promise<GameHistoryInfo[]> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/history` });

        return JSON.parse(res.body);
    }

    async deleteHistory(): Promise<GameHistoryInfo[]> {
        const res: HttpResponse = await invoke('httpDelete', { url: `${this.baseUrl}/history` });

        return JSON.parse(res.body);
    }

    async getChatUserInfo(id: string): Promise<ChatRoomUser> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/chat/user/${id}` });
        return JSON.parse(res.body);
    }

    async getDictionaries(): Promise<DictionaryInfo[]> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/dictionary/info` });

        return JSON.parse(res.body);
    }

    async getDictionary(title: string): Promise<Dictionary> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/dictionary/all/${title}` });

        return JSON.parse(res.body);
    }

    async resetDictionaries(): Promise<Dictionary[]> {
        const res: HttpResponse = await invoke('httpDelete', { url: `${this.baseUrl}/dictionary` });

        return JSON.parse(res.body);
    }

    async deleteDictionary(dictionaryTitle: string): Promise<void> {
        const res: HttpResponse = await invoke('httpPatch', {
            url: `${this.baseUrl}/dictionary`,
            onceToldMe: JSON.stringify({ title: dictionaryTitle }),
        });

        return JSON.parse(res.body);
    }

    async addDictionary(dictionary: Dictionary): Promise<void> {
        const res: HttpResponse = await invoke('httpPost', {
            url: `${this.baseUrl}/dictionary`,
            onceToldMe: JSON.stringify({
                title: dictionary.title,
                description: dictionary.description,
                words: dictionary.words,
            }),
        });

        return JSON.parse(res.body);
    }

    async dictionaryIsInDb(title: string): Promise<void> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/dictionary/isindb/${title}` });

        return JSON.parse(res.body);
    }

    async modifyDictionary(dictionary: ModifiedDictionaryInfo): Promise<void> {
        const res: HttpResponse = await invoke('httpPut', { url: `${this.baseUrl}/dictionary`, onceToldMe: JSON.stringify(dictionary) });

        return JSON.parse(res.body);
    }

    async getBeginnerBots(): Promise<Bot[]> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/virtualPlayer/beginner` });

        return JSON.parse(res.body);
    }

    async getExpertBots(): Promise<Bot[]> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/virtualPlayer/expert` });

        return JSON.parse(res.body);
    }

    async addBot(bot: Bot): Promise<void> {
        const res: HttpResponse = await invoke('httpPost', { url: `${this.baseUrl}/virtualPlayer`, onceToldMe: JSON.stringify(bot) });

        return JSON.parse(res.body);
    }

    async replaceBot(bot: BotNameSwitcher): Promise<void> {
        const res: HttpResponse = await invoke('httpPut', { url: `${this.baseUrl}/virtualPlayer`, onceToldMe: JSON.stringify(bot) });

        return JSON.parse(res.body);
    }

    async resetBot(): Promise<void> {
        const res: HttpResponse = await invoke('httpDelete', { url: `${this.baseUrl}/virtualPlayer/reset` });

        return JSON.parse(res.body);
    }

    async deleteBot(bot: Bot): Promise<void> {
        const res: HttpResponse = await invoke('httpPatch', { url: `${this.baseUrl}/virtualPlayer/remove`, onceToldMe: JSON.stringify(bot) });
        return JSON.parse(res.body);
    }

    async signUp(newUser: IUser): Promise<any> {
        const res: HttpResponse = await invoke('httpPost', { url: `${this.baseUrl}/auth/signUp`, onceToldMe: JSON.stringify(newUser) });
        return JSON.parse(res.body);
    }

    async login(user: IUser): Promise<{ userData: IUser; sessionToken: string }> {
        const res: HttpResponse = await invoke('httpPost', { url: `${this.baseUrl}/auth/login`, onceToldMe: JSON.stringify(user) });
        return JSON.parse(res.body);
    }

    async logout(): Promise<any> {
        await invoke('httpPost', { url: `${this.baseUrl}/auth/logout` });
        return;
    }

    async getStats(): Promise<UserStats> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/profile/stats` });
        return JSON.parse(res.body);
    }

    async getUserHistoryEvents(): Promise<{ historyEventList: HistoryEvent[] }> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/profile/history-events` });
        console.log(JSON.parse(res.body));
        return JSON.parse(res.body);
    }

    async getDefaultImages(): Promise<Map<string, string[]>> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/image/default-pictures` });
        return JSON.parse(res.body);
    }

    async sendProfilePicture(image: AvatarData, imageKey: string): Promise<void> {
        return new Promise((resolve) => {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(image.file);
            fileReader.onload = async () => {
                await fs.writeBinaryFile(image.file.name, new Uint8Array(fileReader.result as ArrayBuffer), { dir: fs.BaseDirectory.Cache });
                await invoke('httpPatch', { url: `${this.baseUrl}/image/profile-picture`, imageKey, path: image.file.name });

                await fs.removeFile(image.file.name, { dir: fs.BaseDirectory.Cache });
                resolve();
            };
        });
    }

    async getProfilePicture(): Promise<{ url: string }> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/image/profile-picture` });
        return JSON.parse(res.body);
    }

    async getRanking(): Promise<{ topRanker: TopRanker[] }> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/highScore/classique` });
        return JSON.parse(res.body);
    }

    async getBotImage(): Promise<{ url: string }> {
        const res: HttpResponse = await invoke('httpGet', { url: `${this.baseUrl}/image/bot/profile-picture` });
        return JSON.parse(res.body);
    }

    async modifyProfilePicture(image: AvatarData, isDefault: boolean): Promise<{ userData: IUser }> {
        if (isDefault) {
            const res: HttpResponse = await invoke('httpPatch', {
                url: `${this.baseUrl}/image/profile-picture`,
                onceToldMe: JSON.stringify({ fileName: image.name }),
            });
            return JSON.parse(res.body);
        }

        return new Promise((resolve) => {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(image.file);
            fileReader.onload = async () => {
                await fs.writeBinaryFile(image.file.name, new Uint8Array(fileReader.result as ArrayBuffer), { dir: fs.BaseDirectory.Cache });

                const res: HttpResponse = await invoke('httpPut', { url: `${this.baseUrl}/image/profile-picture`, path: image.file.name });

                await fs.removeFile(image.file.name, { dir: fs.BaseDirectory.Cache });
                resolve(JSON.parse(res.body));
            };
        });
    }

    async forgotPassword(username: string): Promise<any> {
        const res: HttpResponse = await invoke('httpPost', {
            url: `${this.baseUrl}/profile/forgot-password`,
            onceToldMe: JSON.stringify({ username }),
        });
        return res;
    }

    async modifyLanguage(language: string): Promise<void> {
        await invoke('httpPatch', {
            url: `${this.baseUrl}/profile/language`,
            onceToldMe: JSON.stringify({ language }),
        });
    }

    async modifyTheme(theme: Theme): Promise<void> {
        await invoke('httpPatch', {
            url: `${this.baseUrl}/profile/theme`,
            onceToldMe: JSON.stringify({ theme }),
        });
    }

    async modifyPassword(newPassword: string): Promise<void> {
        await invoke('httpPatch', {
            url: `${this.baseUrl}/profile/password`,
            onceToldMe: JSON.stringify({ newPassword }),
        });
    }

    async modifyUsername(newUsername: string): Promise<HttpResponse> {
        const res: HttpResponse = await invoke('httpPatch', {
            url: `${this.baseUrl}/profile/username`,
            onceToldMe: JSON.stringify({ newUsername }),
        });

        return res;
    }

    // private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
    //     return () => of(result as T);
    // }
}
