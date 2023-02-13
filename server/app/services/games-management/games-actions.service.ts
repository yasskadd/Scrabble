import { Gameboard } from '@app/classes/gameboard.class';
import { Player } from '@app/classes/player/player.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { Word } from '@app/classes/word.class';
import { PlaceLettersReturn } from '@app/interfaces/place-letters-return';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { GamesHandler } from './games-handler.service';

const CHAR_ASCII = 96;
@Service()
export class GamesActionsService {
    constructor(private socketManager: SocketManager, private gamesHandler: GamesHandler, private rackService: RackService) {}
    initSocketsEvents(): void {
        this.socketManager.on(SocketEvents.Play, (socket, commandInfo: CommandInfo) => {
            this.playGame(socket, commandInfo);
        });

        this.socketManager.on(SocketEvents.Exchange, (socket, letters: string[]) => {
            this.exchange(socket, letters);
        });

        this.socketManager.on(SocketEvents.ReserveCommand, (socket) => {
            this.reserveCommand(socket);
        });

        this.socketManager.on(SocketEvents.Skip, (socket) => {
            this.skip(socket);
        });

        this.socketManager.on(SocketEvents.ClueCommand, (socket) => {
            this.clueCommand(socket);
        });
    }

    private clueCommand(this: this, socket: Socket) {
        const letterString: string[] = [];
        const player = this.gamesHandler.players.get(socket.id) as Player;
        player.clueCommandUseCount++;
        player.game.wordSolver.setGameboard(player.game.gameboard as Gameboard);
        player.rack.forEach((letter) => {
            letterString.push(letter.value);
        });
        const wordToChoose: CommandInfo[] = this.configureClueCommand(player.game.wordSolver.findAllOptions(letterString));
        socket.emit(SocketEvents.ClueCommand, wordToChoose);
    }

    private configureClueCommand(commandInfoList: CommandInfo[]): CommandInfo[] {
        const wordToChoose: CommandInfo[] = [];
        for (let i = 0; i < 3; i++) {
            if (commandInfoList.length === 0) break;
            const random = Math.floor(Math.random() * commandInfoList.length);
            wordToChoose.push(commandInfoList[random]);
            commandInfoList.splice(random, 1);
        }
        return wordToChoose;
    }

    private reserveCommand(this: this, socket: Socket) {
        if (!this.gamesHandler.players.has(socket.id)) return;
        const player = this.gamesHandler.players.get(socket.id) as Player;
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
        this.gamesHandler.updatePlayerInfo(socket, player.room, player.game);
        this.socketManager.emitRoom(player.room, SocketEvents.Play, player.getInformation(), player.game.turn.activePlayer);
    }

    private playGame(this: this, socket: Socket, commandInfo: CommandInfo) {
        if (!this.gamesHandler.players.has(socket.id)) return;
        let direction: string;
        if (commandInfo.isHorizontal === undefined) direction = '';
        else direction = commandInfo.isHorizontal ? 'h' : 'v';

        const commandWrite = `!placer ${String.fromCharCode(CHAR_ASCII + commandInfo.firstCoordinate.y)}${
            commandInfo.firstCoordinate.x
        }${direction} ${commandInfo.letters.join('')}`;
        const player = this.gamesHandler.players.get(socket.id) as RealPlayer;
        const play = player.placeLetter(commandInfo);

        if (typeof play === 'string') {
            socket.emit(SocketEvents.ImpossibleCommandError, play);
            return;
        }
        this.socketManager.emitRoom(player.room, SocketEvents.ViewUpdate, {
            gameboard: play.gameboard.gameboardTiles,
            activePlayer: player.game.turn.activePlayer,
        });
        this.gamesHandler.updatePlayerInfo(socket, player.room, player.game);
        this.sendValidCommand(play, socket, player.room, commandWrite);
    }

    private sendValidCommand(play: PlaceLettersReturn, socket: Socket, room: string, commandWrite: string) {
        if (play.hasPassed) {
            socket.broadcast.to(room).emit(SocketEvents.GameMessage, commandWrite);
            return;
        }
        play.invalidWords.forEach((invalidWord: Word) =>
            socket.emit(SocketEvents.ImpossibleCommandError, 'Le mot "' + invalidWord.stringFormat + '" ne fait pas partie du dictionnaire français'),
        );
    }
}
