import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterPlacement } from '@app/classes/letter-placement.class';
import { Player } from '@app/classes/player/player.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { Behavior } from '@app/interfaces/behavior';
import { Dictionary } from '@app/interfaces/dictionary';
import { GameScrabbleInformation } from '@app/interfaces/game-scrabble-information';
import { DictionaryStorageService } from '@app/services/database/dictionary-storage.service';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { ModifiedDictionaryInfo } from '@common/interfaces/modified-dictionary-info';
import { Container, Service } from 'typedi';

@Service()
export class GamesHandler {
    players: Map<string, Player>;
    gamePlayers: Map<string, { gameInfo: GameScrabbleInformation; players: Player[] }>;
    dictionaries: Map<string, Behavior>;

    constructor(private socketManager: SocketManager, private dictionaryStorage: DictionaryStorageService) {
        this.players = new Map();
        this.gamePlayers = new Map();
        this.dictionaries = new Map();
        this.setDictionaries();
    }

    updatePlayerInfo(roomId: string, game: Game) {
        const gameInfos = this.gamePlayers.get(roomId);
        const players = gameInfos?.players as Player[];
        if ((gameInfos?.players as Player[]) === undefined) return;
        gameInfos?.gameInfo.socketId.forEach((socket, i) => {
            const myPlayer = players[i];
            this.socketManager.emitRoom(socket, SocketEvents.UpdatePlayerInformation, myPlayer.getInformation());
            const opponentPlayers = players.filter((player) => {
                return player !== myPlayer;
            });
            const opponentPlayersInfos = opponentPlayers.map((player) => {
                return player.getInformation();
            });
            this.socketManager.emitRoom(socket, SocketEvents.UpdateOpponentInformation, opponentPlayersInfos);
        });
        this.socketManager.emitRoom(gameInfos?.gameInfo.roomId as string, SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
    }

    async setDictionaries() {
        const dictionaries = await this.getDictionaries();
        const tempDictionariesMap: Map<string, Behavior> = new Map();
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
            const behavior = {
                dictionaryValidation: dictionaryValidation as DictionaryValidation,
                wordSolver: wordSolver as WordSolver,
                letterPlacement: letterPlacement as LetterPlacement,
            };
            this.dictionaries.set(dictionary.title, behavior);
        }
    }

    async updateDictionary(dictionaryModification: ModifiedDictionaryInfo) {
        await this.dictionaryStorage.updateDictionary(dictionaryModification);
        const behavior = this.dictionaries.get(dictionaryModification.title) as Behavior;
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
        const dictionary = JSON.parse((await this.dictionaryStorage.getDictionary(title)).toString());
        return dictionary;
    }
}
