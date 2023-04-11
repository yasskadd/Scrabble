import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterPlacement } from '@app/classes/letter-placement.class';
import { GamePlayer } from '@app/classes/player/player.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryContainer } from '@app/interfaces/dictionary-container';
import { DictionaryStorageService } from '@app/services/database/dictionary-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { INVALID_INDEX } from '@common/constants/board-info';
import { SocketEvents } from '@common/constants/socket-events';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { PlayerInformation } from '@common/interfaces/player-information';
import { PlayerType } from '@common/models/player-type';
import { ReplaySubject } from 'rxjs/internal/ReplaySubject';
import { Service } from 'typedi';

@Service()
export class GamesHandlerService {
    players: GamePlayer[];
    // gamePlayers: Map<string, { room: GameRoom; players: GamePlayer[] }>;
    dictionaries: Map<string, DictionaryContainer>;
    deleteWaitingRoom: ReplaySubject<string | undefined>;
    constructor(private socketManager: SocketManager, private dictionaryStorage: DictionaryStorageService) {
        // this.gamePlayers = new Map();
        this.players = [];
        this.dictionaries = new Map();
        this.setDictionaries().then();
        this.deleteWaitingRoom = new ReplaySubject(1);
    }

    updatePlayersInfo(roomId: string, game: Game) {
        // const gameRoom = this.gamePlayers.get(roomId);
        // const players = gameRoom?.players;
        // if (!players) return;
        // if ((gameRoom?.players as GamePlayer[]) === undefined) return;

        const infos: PlayerInformation[] = this.players.map((player: GamePlayer) => player.getInformation());
        // this.players.forEach((gamePlayer: GamePlayer) => {
        //     const socket: Socket | undefined = this.socketManager.getSocketFromId(gamePlayer.player.socketId);
        //     if (!socket) return;
        //
        //     socket.emit(SocketEvents.UpdatePlayersInformation, infos);
        // });

        this.socketManager.emitRoom(roomId, SocketEvents.UpdatePlayersInformation, infos);
        this.socketManager.emitRoom(roomId, SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
    }

    getPlayerFromSocketId(socketId: string): GamePlayer | undefined {
        return this.players.find((gamePlayer: GamePlayer) => gamePlayer.player.socketId === socketId);
    }

    getPlayersFromRoomId(roomId: string): GamePlayer[] {
        return this.players.filter((gamePlayer: GamePlayer) => gamePlayer.player.roomId === roomId);
    }

    removePlayerFromSocketId(socketId: string): void {
        const player = this.players.find((gamePlayer: GamePlayer) => gamePlayer.player.socketId === socketId);
        if (!player) return;

        const playerIndex = this.players.findIndex((gamePlayer: GamePlayer) => gamePlayer.player.socketId === socketId);
        if (playerIndex !== INVALID_INDEX) {
            this.players.splice(playerIndex, 1);
        }

        if (
            this.players.filter(
                (gamePlayer: GamePlayer) => gamePlayer.player.roomId === player.player.roomId && gamePlayer.player.type === PlayerType.User,
            ).length === 0
        ) {
            this.removeRoomFromRoomId(player.player.roomId);
        }
    }

    removeRoomFromRoomId(roomId: string): void {
        const playerIndexes: number[] = [];
        this.players.forEach((gamePlayer: GamePlayer, index: number) => {
            if (gamePlayer.player.roomId === roomId) {
                playerIndexes.push(index);
            }
        });
        playerIndexes.reverse();
        playerIndexes.forEach((index: number) => {
            this.players.splice(index, 1);
        });
        this.deleteWaitingRoom.next(roomId);
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
