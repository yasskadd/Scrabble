import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterPlacement } from '@app/classes/letter-placement.class';
import { GamePlayer } from '@app/classes/player/player.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { DictionaryContainer } from '@app/interfaces/dictionaryContainer';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryStorageService } from '@app/services/database/dictionary-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { Service } from 'typedi';
import { Socket } from 'socket.io';
import { PlayerInformation } from '@common/interfaces/player-information';

@Service()
export class GamesHandler {
    players: GamePlayer[];
    // gamePlayers: Map<string, { room: GameRoom; players: GamePlayer[] }>;
    dictionaries: Map<string, DictionaryContainer>;

    constructor(private socketManager: SocketManager, private dictionaryStorage: DictionaryStorageService) {
        // this.gamePlayers = new Map();
        this.players = [];
        this.dictionaries = new Map();
        this.setDictionaries().then();
    }

    updatePlayersInfo(roomId: string, game: Game) {
        // const gameRoom = this.gamePlayers.get(roomId);
        // const players = gameRoom?.players;
        // if (!players) return;
        // if ((gameRoom?.players as GamePlayer[]) === undefined) return;

        this.players.forEach((gamePlayer: GamePlayer) => {
            const socket: Socket | undefined = this.socketManager.getSocketFromId(gamePlayer.player.socketId);
            if (!socket) return;

            socket.emit(SocketEvents.UpdatePlayerInformation, gamePlayer.getInformation());

            // TODO : Update that
            const opponentPlayersInfos: (PlayerInformation | undefined)[] = this.players.map((player: GamePlayer) => {
                if (player.player.user.username !== gamePlayer.player.user.username) {
                    return player.getInformation();
                }
                return;
            });
            console.log(opponentPlayersInfos);

            socket.broadcast.to(roomId).emit(SocketEvents.UpdateOpponentInformation, opponentPlayersInfos);
        });

        this.socketManager.emitRoom(roomId, SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
    }

    getPlayerFromSocketId(socketId: string): GamePlayer | undefined {
        return this.players.find((gamePlayer: GamePlayer) => gamePlayer.player.socketId === socketId);
    }

    getPlayersFromRoomId(roomId: string): GamePlayer[] {
        return this.players.filter((gamePlayer: GamePlayer) => gamePlayer.player.roomId === roomId);
    }

    removePlayerFromSocketId(socketId: string): void {
        this.players = this.players.filter((gamePlayer: GamePlayer) => gamePlayer.player.socketId !== socketId);
    }

    removeRoomFromRoomId(roomId: string): void {
        this.players = this.players.filter((gamePlayer: GamePlayer) => gamePlayer.player.roomId !== roomId);
    }

    async setDictionaries() {
        const dictionaries = await this.getDictionaries();
        const tempDictionariesMap: Map<string, DictionaryContainer> = new Map();
        dictionaries.forEach((dictionary) => {
            const dictionaryValidation = new DictionaryValidation(dictionary.words);
            const wordSolver = new WordSolver(dictionaryValidation);
            const letterPlacement = new LetterPlacement(dictionaryValidation);
            const behavior = {
                dictionaryValidation: dictionaryValidation as DictionaryValidation,
                wordSolver: wordSolver as WordSolver,
                letterPlacement: letterPlacement as LetterPlacement,
            };
            tempDictionariesMap.set(dictionary.title, behavior);
        });
        this.dictionaries = tempDictionariesMap;
    }

    async addDictionary(dictionary: Dictionary) {
        try {
            await this.dictionaryIsInDb(dictionary.title);
        } catch {
            await this.dictionaryStorage.addDictionary(dictionary.title, JSON.stringify(dictionary));
            const dictionaryValidation = new DictionaryValidation(dictionary.words);
            const wordSolver = new WordSolver(dictionaryValidation);
            const letterPlacement = new LetterPlacement(dictionaryValidation);
            const dictionaryContainer = {
                dictionaryValidation: dictionaryValidation as DictionaryValidation,
                wordSolver: wordSolver as WordSolver,
                letterPlacement: letterPlacement as LetterPlacement,
            };
            this.dictionaries.set(dictionary.title, dictionaryContainer);
        }
    }

    async updateDictionary(dictionaryModification: ModifiedDictionaryInfo) {
        await this.dictionaryStorage.updateDictionary(dictionaryModification);
        const behavior = this.dictionaries.get(dictionaryModification.title) as DictionaryContainer;
        this.dictionaries.delete(dictionaryModification.title);
        this.dictionaries.set(dictionaryModification.newTitle, behavior);
    }

    async resetDictionaries() {
        const files = (await this.dictionaryStorage.getDictionariesFileName()).filter((file) => file !== 'dictionary.json');
        for (const file of files) {
            await this.deleteDictionary(file.replace('.json', ''));
        }
    }

    async deleteDictionary(title: string) {
        await this.dictionaryStorage.deletedDictionary(title);
        this.dictionaries.delete(title);
    }

    async dictionaryIsInDb(title: string): Promise<void> {
        if (title === 'Mon dictionnaire') title = 'dictionary';
        return await this.dictionaryStorage.dictionaryIsInDb(title);
    }

    async getDictionaries(): Promise<Dictionary[]> {
        return await this.dictionaryStorage.getDictionaries();
    }

    async getDictionary(title: string): Promise<Dictionary> {
        if (title === 'Mon dictionnaire') title = 'dictionary';

        return JSON.parse((await this.dictionaryStorage.getDictionary(title)).toString());
    }
}
