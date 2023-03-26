import { Player } from '@app/classes/player/player.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { Word } from '@app/classes/word.class';
import { PlaceLettersReturn } from '@app/interfaces/place-letters-return';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { PlayCommandInfo, ViewUpdateInfo } from '@common/interfaces/game-actions';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { GamesHandler } from './games-handler.service';

const CHAR_ASCII = 96;
const CLUE_COUNT_PER_COMMAND_CALL = 3;

@Service()
export class GamesActionsService {
    constructor(private socketManager: SocketManager, private gamesHandler: GamesHandler, private rackService: RackService) {}
    initSocketsEvents(): void {
        this.socketManager.on(SocketEvents.Play, this.playGame);
        this.socketManager.on(SocketEvents.Exchange, this.exchange);
        this.socketManager.on(SocketEvents.ReserveCommand, this.reserveCommand);
        this.socketManager.on(SocketEvents.Skip, this.skip);
        this.socketManager.on(SocketEvents.ClueCommand, this.clueCommand);
    }

    private clueCommand(this: this, socket: Socket) {
        const letterString: string[] = [];
        const player = this.gamesHandler.players.get(socket.id) as Player;

        player.clueCommandUseCount++;
        player.game.wordSolver.setGameboard(player.game.gameboard);
        player.rack.forEach((letter) => letterString.push(letter.value));

        const wordToChoose: PlayCommandInfo[] = this.reduceClueOptions(player.game.wordSolver.findAllOptions(letterString));
        socket.emit(SocketEvents.ClueCommand, wordToChoose);
    }

    private reduceClueOptions(commandInfoList: PlayCommandInfo[]): PlayCommandInfo[] {
        const wordToChoose: PlayCommandInfo[] = [];

        for (let i = 0; i < CLUE_COUNT_PER_COMMAND_CALL; i++) {
            if (commandInfoList.length === 0) break;
            const random = Math.floor(Math.random() * commandInfoList.length);
            wordToChoose.push(commandInfoList[random]);
            commandInfoList.splice(random, 1);
        }

        return wordToChoose;
    }

    private reserveCommand(this: this, socket: Socket) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const player: Player = this.gamesHandler.players.get(socket.id) as Player;
        socket.emit(SocketEvents.AllReserveLetters, player.game.letterReserve.lettersReserve);
    }

    private skip(this: this, socket: Socket) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const player = this.gamesHandler.players.get(socket.id) as RealPlayer;
        player.skipTurn();
        socket.broadcast.to(player.room).emit(SocketEvents.GameMessage, '!passer');
    }

    private exchange(this: this, socket: Socket, letters: string[]) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const lettersToExchange = letters.length;
        const player = this.gamesHandler.players.get(socket.id) as RealPlayer;

        if (!this.rackService.areLettersInRack(letters, player)) {
            socket.emit(SocketEvents.ImpossibleCommandError, 'Vous ne possédez pas toutes les lettres à échanger');
            return;
        }

        player.exchangeLetter(letters);
        socket.broadcast.to(player.room).emit(SocketEvents.GameMessage, `!echanger ${lettersToExchange} lettres`);

        this.gamesHandler.updatePlayerInfo(player.room, player.game);
        this.socketManager.emitRoom(player.room, SocketEvents.Play, player.getInformation(), player.game.turn.activePlayer);
    }

    private playGame(this: this, socket: Socket, commandInfo: PlayCommandInfo) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const direction: string = commandInfo.isHorizontal === undefined ? '' : commandInfo.isHorizontal ? 'h' : 'v';
        const commandWrite = `!placer ${String.fromCharCode(CHAR_ASCII + commandInfo.firstCoordinate.y)}${
            commandInfo.firstCoordinate.x
        }${direction} ${commandInfo.letters.join('')}`;
        const player = this.gamesHandler.players.get(socket.id) as RealPlayer;
        const play = player.placeLetter(commandInfo);

        if (typeof play === 'string') {
            socket.emit(SocketEvents.ImpossibleCommandError, play);
            return;
        }

        const viewUpdateInfo: ViewUpdateInfo = {
            gameboard: play.gameboard.toStringArray(),
            activePlayer: player.game.turn.activePlayer,
        };
        this.socketManager.emitRoom(player.room, SocketEvents.PublicViewUpdate, viewUpdateInfo);

        this.gamesHandler.updatePlayerInfo(player.room, player.game);
        this.sendValidCommand(play, socket, player.room, commandWrite);
    }

    private sendValidCommand(play: PlaceLettersReturn, socket: Socket, room: string, commandWrite: string) {
        if (play.hasPassed) socket.broadcast.to(room).emit(SocketEvents.GameMessage, commandWrite);
        else
            play.invalidWords.forEach((invalidWord: Word) =>
                socket.emit(
                    SocketEvents.ImpossibleCommandError,
                    'Le mot "' + invalidWord.stringFormat + '" ne fait pas partie du dictionnaire français',
                ),
            );
    }
}
