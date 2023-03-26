import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterPlacement } from '@app/classes/letter-placement.class';
import { GamePlayer } from '@app/classes/player/player.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { DictionaryContainer } from '@app/interfaces/dictionaryContainer';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryStorageService } from '@app/services/database/dictionary-storage.service';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { Container, Service } from 'typedi';
import { GameRoom } from '@common/interfaces/game-room';
import { RoomPlayer } from '@common/interfaces/room-player';
import { Socket } from 'socket.io';

@Service()
export class GamesHandler {
    players: Map<string, GamePlayer>;
    gamePlayers: Map<string, { room: GameRoom; players: GamePlayer[] }>;
    dictionaries: Map<string, DictionaryContainer>;

    constructor(private socketManager: SocketManager, private dictionaryStorage: DictionaryStorageService) {
        this.players = new Map();
        this.gamePlayers = new Map();
        this.dictionaries = new Map();
        this.setDictionaries().then();
    }

    updatePlayerInfo(roomId: string, game: Game) {
        const gameInfos = this.gamePlayers.get(roomId);
        const players = gameInfos?.players;
        if (!players) return;
        if ((gameInfos?.players as GamePlayer[]) === undefined) return;

        gameInfos?.room.players.forEach((roomPlayer: RoomPlayer, i) => {
            const socket: Socket | undefined = this.socketManager.getSocketFromId(roomPlayer.socketId);
            if (!socket) return;

            socket.emit(SocketEvents.UpdatePlayerInformation, players[i].getInformation());

            const opponentPlayers = players.filter((player: GamePlayer) => {
                return player !== players[i];
            });
            const opponentPlayersInfos = opponentPlayers.map((player) => {
                return player.getInformation();
            });

            socket.broadcast.to(roomId).emit(SocketEvents.UpdateOpponentInformation, opponentPlayersInfos);
        });

        this.socketManager.emitRoom(roomId, SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
    }

    async setDictionaries() {
        const dictionaries = await this.getDictionaries();
        const tempDictionariesMap: Map<string, DictionaryContainer> = new Map();
        dictionaries.forEach((dictionary) => {
            const dictionaryValidation = new DictionaryValidation(dictionary.words);
            const wordSolver = new WordSolver(dictionaryValidation);
            const letterPlacement = new LetterPlacement(dictionaryValidation, Container.get(RackService));
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
            const letterPlacement = new LetterPlacement(dictionaryValidation, Container.get(RackService));
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
