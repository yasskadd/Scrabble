import { Gameboard } from '@app/classes/gameboard.class';
import { GamePlayer } from '@app/classes/player/player.class';
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

    private clueCommand(socket: Socket) {
        const letterString: string[] = [];
        const player = this.gamesHandler.players.find((gamePlayer: GamePlayer) => gamePlayer.player.socketId === socket.id);
        if (!player) return;

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

    private reserveCommand(socket: Socket) {
        const player = this.gamesHandler.getPlayerFromSocketId(socket.id);
        if (!player) return;

        socket.emit(SocketEvents.AllReserveLetters, player.game.letterReserve.lettersReserve);
    }

    private skip(socket: Socket) {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id) as RealPlayer;
        if (!gamePlayer) return;

        gamePlayer.skipTurn();
        socket.broadcast.to(gamePlayer.player.roomId).emit(SocketEvents.GameMessage, '!passer');
    }

    private exchange(socket: Socket, letters: string[]) {
        const lettersToExchange = letters.length;
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id) as RealPlayer;
        if (!gamePlayer) return;

        if (!this.rackService.areLettersInRack(letters, gamePlayer)) {
            socket.emit(SocketEvents.ImpossibleCommandError, 'Vous ne possédez pas toutes les lettres à échanger');
            return;
        }
        gamePlayer.exchangeLetter(letters);

        socket.broadcast.to(gamePlayer.player.roomId).emit(SocketEvents.GameMessage, `!echanger ${lettersToExchange} lettres`);
        this.gamesHandler.updatePlayersInfo(gamePlayer.player.roomId, gamePlayer.game);
        this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.Play, gamePlayer.getInformation(), gamePlayer.game.turn.activePlayer);
    }

    private playGame(socket: Socket, commandInfo: CommandInfo) {
        let direction: string;
        if (commandInfo.isHorizontal === undefined) direction = '';
        else direction = commandInfo.isHorizontal ? 'h' : 'v';

        const commandWrite = `!placer ${String.fromCharCode(CHAR_ASCII + commandInfo.firstCoordinate.y)}${
            commandInfo.firstCoordinate.x
        }${direction} ${commandInfo.letters.join('')}`;
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id) as RealPlayer;
        if (!gamePlayer) return;

        const play = gamePlayer.placeLetter(commandInfo);
        if (typeof play === 'string') {
            socket.emit(SocketEvents.ImpossibleCommandError, play);
            return;
        }

        this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.PublicViewUpdate, {
            gameboard: play.gameboard.gameboardTiles,
            activePlayer: gamePlayer.game.turn.activePlayer,
        });
        this.gamesHandler.updatePlayersInfo(gamePlayer.player.roomId, gamePlayer.game);
        this.sendValidCommand(play, socket, gamePlayer.player.roomId, commandWrite);
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
