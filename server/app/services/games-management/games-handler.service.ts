import { Game } from '@app/classes/game.class';
import { Player } from '@app/classes/player/player.class';
import { Behavior } from '@app/interfaces/behavior';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryStorageService } from '@app/services/database/dictionary-storage.service';
import { DictionaryValidationService } from '@app/services/dictionary-validation.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { WordSolverService } from '@app/services/word-solver.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Socket } from 'socket.io';
import { Container, Service } from 'typedi';

@Service()
export class GamesHandler {
    players: Map<string, Player>;
    gamePlayers: Map<string, Player[]>;
    dictionaries: Map<string, Behavior>;

    constructor(private socketManager: SocketManager, private dictionaryStorage: DictionaryStorageService) {
        this.players = new Map();
        this.gamePlayers = new Map();
        this.dictionaries = new Map();
        this.setDictionaries();
    }

    resetDictionaries() {
        throw new Error('Method not implemented.');
    }

    replaceDictionary(infoToReplace: unknown) {
        throw new Error('Method not implemented.');
    }

    updatePlayerInfo(socket: Socket, roomId: string, game: Game) {
        const player = this.players.get(socket.id) as Player;
        const players = this.gamePlayers.get(roomId) as Player[];
        let playerIndex: number;
        if (players === undefined) return;
        if (player === undefined) {
            if (players[0].isPlayerOne) playerIndex = 1;
            else playerIndex = 0;
        } else playerIndex = player.isPlayerOne ? 0 : 1;
        const secondPlayerIndex = Math.abs(playerIndex - 1);

        socket.emit(SocketEvents.UpdatePlayerInformation, players[playerIndex].getInformation());
        socket.emit(SocketEvents.UpdateOpponentInformation, players[secondPlayerIndex].getInformation());
        socket.broadcast.to(roomId).emit(SocketEvents.UpdatePlayerInformation, players[secondPlayerIndex].getInformation());
        socket.broadcast.to(roomId).emit(SocketEvents.UpdateOpponentInformation, players[playerIndex].getInformation());

        this.socketManager.emitRoom(roomId, SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
    }

    async setDictionaries() {
        const dictionaries = await this.getDictionaries();
        const tempDictionariesMap: Map<string, Behavior> = new Map();
        dictionaries.forEach((dictionary) => {
            const dictionaryValidation = new DictionaryValidationService(dictionary.words);
            const wordSolver = new WordSolverService(dictionaryValidation);
            const letterPlacement = new LetterPlacementService(dictionaryValidation, Container.get(RackService));
            const behavior = {
                dictionaryValidation: dictionaryValidation as DictionaryValidationService,
                wordSolver: wordSolver as WordSolverService,
                letterPlacement: letterPlacement as LetterPlacementService,
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
            const dictionaryValidation = new DictionaryValidationService(dictionary.words);
            const wordSolver = new WordSolverService(dictionaryValidation);
            const letterPlacement = new LetterPlacementService(dictionaryValidation, Container.get(RackService));
            const behavior = {
                dictionaryValidation: dictionaryValidation as DictionaryValidationService,
                wordSolver: wordSolver as WordSolverService,
                letterPlacement: letterPlacement as LetterPlacementService,
            };
            this.dictionaries.set(dictionary.title, behavior);
        }
    }

    async updateDictionary(oldDictionaryTitle: string, field: string, content: string) {
        await this.dictionaryStorage.updateDictionary(oldDictionaryTitle, field, content);
        const newTitle = field === 'title' ? content : oldDictionaryTitle;
        const behavior = this.dictionaries.get(oldDictionaryTitle) as Behavior;
        this.dictionaries.delete(oldDictionaryTitle);
        this.dictionaries.set(newTitle, behavior);
    }

    async deleteDictionary(title: string) {
        await this.dictionaryStorage.deletedDictionary(title);
        this.dictionaries.delete(title);
    }

    async dictionaryIsInDb(title: string) {
        return await this.dictionaryStorage.dictionaryIsInDb(title);
    }

    async getDictionaries(): Promise<Dictionary[]> {
        return await this.dictionaryStorage.getDictionaries();
    }
}
