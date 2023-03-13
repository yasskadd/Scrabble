import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterPlacement } from '@app/classes/letter-placement.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { BeginnerBot } from '@app/classes/player/beginner-bot.class';
import { Bot } from '@app/classes/player/bot.class';
import { ExpertBot } from '@app/classes/player/expert-bot.class';
import { Player } from '@app/classes/player/player.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { Turn } from '@app/classes/turn.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { BOT_BEGINNER_DIFFICULTY } from '@app/constants/bot';
import { NUMBER_OF_PLAYERS } from '@app/constants/players';
import { Behavior } from '@app/interfaces/behavior';
import { GameScrabbleInformation } from '@app/interfaces/game-scrabble-information';
import { ScoreStorageService } from '@app/services/database/score-storage.service';
import { VirtualPlayersStorageService } from '@app/services/database/virtual-players-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { GamesHandler } from './games-handler.service';

const MAX_SKIP = 6;
const SECOND = 1000;

@Service()
export class GamesStateService {
    gameEnded: Subject<string>;

    constructor(
        private socketManager: SocketManager,
        private gamesHandler: GamesHandler,
        private readonly scoreStorage: ScoreStorageService,
        private virtualPlayerStorage: VirtualPlayersStorageService,
    ) {
        this.gameEnded = new Subject();
    }

    initSocketsEvents(): void {
        this.socketManager.on(SocketEvents.CreateScrabbleGame, async (socket, gameInfo: GameScrabbleInformation) => await this.createGame(gameInfo));

        this.socketManager.on(SocketEvents.Disconnect, (socket) => {
            this.disconnect(socket);
        });

        this.socketManager.on(SocketEvents.AbandonGame, (socket) => {
            this.abandonGame(socket);
        });

        this.socketManager.on(SocketEvents.QuitGame, (socket) => {
            this.disconnect(socket);
        });
    }

    async createGame(this: this, gameInfo: GameScrabbleInformation) {
        const players = this.initPlayers(gameInfo);
        const game = this.createNewGame(gameInfo);
        const gameCreator = players[0];

        this.initializePlayers(players, game, gameInfo.socketId);
        this.gamesHandler.updatePlayerInfo(gameCreator.room, game);
        this.gameSubscriptions(gameInfo, game);

        this.socketManager.emitRoom(gameInfo.roomId, SocketEvents.ViewUpdate, {
            gameboard: game.gameboard.gameboardTiles,
            activePlayer: game.turn.activePlayer,
        });
        this.socketManager.emitRoom(gameInfo.roomId, SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
        this.sendObjectivesToClient(players[0], players[1]);
    }

    private sendObjectivesToClient(playerOne: Player, playerTwo: Player) {
        if (!playerOne.game.isMode2990) return;

        this.socketManager.emitRoom(playerOne.room, 'InitObjective', {
            objectives1: playerOne.objectives,
            objectives2: playerTwo.objectives,
            playerName: playerOne.name,
        });
    }

    private initializePlayers(players: Player[], game: Game, socketId: string[]) {
        game.gameMode = game.isMode2990 ? 'LOG2990' : 'classique';
        socketId.forEach((socket, i) => {
            if (i === 0) (players[i] as RealPlayer).setGame(game, true);
            else (players[i] as RealPlayer).setGame(game, false);
        });

        for (let i = socketId.length; i < players.length; i++) {
            (players[i] as Bot).setGame(game);
            (players[i] as Bot).start();
        }

        if (socketId.length === 1) game.isModeSolo = true;
    }

    private async gameSubscriptions(gameInfo: GameScrabbleInformation, game: Game) {
        game.turn.endTurn.subscribe(async () => {
            this.endGameScore(gameInfo.roomId);
            this.changeTurn(gameInfo.roomId);
            if (game.turn.activePlayer === undefined) {
                this.userConnected(gameInfo.socketId, gameInfo.roomId);
            }
        });

        game.turn.countdown.subscribe((timer: number) => {
            this.sendTimer(gameInfo.roomId, timer);
        });
    }

    private endGameScore(roomID: string) {
        const players = this.gamesHandler.gamePlayers.get(roomID)?.players as Player[];
        if (!players) {
            return;
        }
        const game = players[0].game;
        if (game.turn.skipCounter === MAX_SKIP) {
            players.forEach((player) => {
                player.deductPoints();
            });
            if (players[0].game.isMode2990) game.objectivesHandler.verifyClueCommandEndGame(players);
            return;
        }
        if (players[0].rackIsEmpty() || players[1].rackIsEmpty()) {
            const winnerPlayer = players[0].rackIsEmpty() ? players[0] : players[1];
            const loserPlayer = players[0].rackIsEmpty() ? players[1] : players[0];
            winnerPlayer.addPoints(loserPlayer.rack);
            loserPlayer.deductPoints();
            if (players[0].game.isMode2990) game.objectivesHandler.verifyClueCommandEndGame(players);
        }
    }

    private initPlayers(gameInfo: GameScrabbleInformation): Player[] {
        const players: Player[] = [];
        gameInfo.socketId.forEach((socket, i) => {
            const newPlayer: Player = new RealPlayer(gameInfo.playerName[i]);
            newPlayer.room = gameInfo.roomId;
            this.gamesHandler.players.set(socket, newPlayer);
            players.push(newPlayer);
            if (this.gamesHandler.gamePlayers.get(newPlayer.room) === undefined)
                this.gamesHandler.gamePlayers.set(newPlayer.room, { gameInfo, players: [] as Player[] });
            (this.gamesHandler.gamePlayers.get(newPlayer.room)?.players as Player[]).push(newPlayer);
        });

        while (players.length !== NUMBER_OF_PLAYERS) {
            if (gameInfo.botDifficulty !== undefined) {
                const dictionaryValidation = (this.gamesHandler.dictionaries.get(gameInfo.dictionary) as Behavior).dictionaryValidation;
                let newPlayer: Player;
                if (gameInfo.botDifficulty === BOT_BEGINNER_DIFFICULTY) {
                    newPlayer = new BeginnerBot(false, gameInfo.playerName[players.length], {
                        timer: gameInfo.timer,
                        roomId: gameInfo.roomId,
                        dictionaryValidation: dictionaryValidation as DictionaryValidation,
                    });
                    players.push(newPlayer);
                } else {
                    newPlayer = new ExpertBot(false, gameInfo.playerName[players.length], {
                        timer: gameInfo.timer,
                        roomId: gameInfo.roomId,
                        dictionaryValidation: dictionaryValidation as DictionaryValidation,
                    });
                    players.push(newPlayer);
                }
                if (this.gamesHandler.gamePlayers.get(newPlayer.room) === undefined)
                    this.gamesHandler.gamePlayers.set(newPlayer.room, { gameInfo, players: [] as Player[] });
                (this.gamesHandler.gamePlayers.get(newPlayer.room)?.players as Player[]).push(newPlayer);
            }
        }
        return players;
    }

    private createNewGame(gameInfo: GameScrabbleInformation): Game {
        const players = this.gamesHandler.gamePlayers.get(gameInfo.roomId)?.players as Player[];
        const gameBehavior = this.gamesHandler.dictionaries.get(gameInfo.dictionary);
        return new Game(
            players,
            new Turn(gameInfo.timer),
            new LetterReserve(),
            gameInfo.mode === 'classique' ? false : true,
            (gameBehavior as Behavior).dictionaryValidation as DictionaryValidation,
            (gameBehavior as Behavior).letterPlacement as LetterPlacement,
            (gameBehavior as Behavior).wordSolver as WordSolver,
        );
    }

    private changeTurn(roomId: string) {
        const players = this.gamesHandler.gamePlayers.get(roomId)?.players as Player[];
        const gameInfo = {
            gameboard: players[0].game.gameboard.gameboardTiles,
            players: players.map((x) => x.getInformation()),
            activePlayer: players[0].game.turn.activePlayer,
        };
        this.socketManager.emitRoom(roomId, SocketEvents.Skip, gameInfo);
    }

    private sendTimer(roomId: string, timer: number) {
        this.socketManager.emitRoom(roomId, SocketEvents.TimerClientUpdate, timer);
    }

    private abandonGame(socket: Socket) {
        if (!this.gamesHandler.players.has(socket.id)) return;

        const player = this.gamesHandler.players.get(socket.id) as Player;
        const room = player.room;
        this.gamesHandler.players.delete(socket.id);
        socket.leave(room);
        if (!player.game.isModeSolo) {
            this.socketManager.emitRoom(room, SocketEvents.UserDisconnect);
            this.switchToSolo(socket, player);
            return;
        }
        player.game.abandon();
        this.gameEnded.next(player.room);
        this.gamesHandler.gamePlayers.delete(player.room);
    }

    private async switchToSolo(socket: Socket, playerToReplace: Player) {
        const info = playerToReplace.getInformation();
        const playerInRoom = this.gamesHandler.gamePlayers.get(playerToReplace.room)?.players;
        if (playerInRoom === undefined) return;
        const botName = await this.generateBotName(playerInRoom[1] === playerToReplace ? playerInRoom[0].name : playerInRoom[1].name);

        const botPlayer = new BeginnerBot(false, botName, {
            timer: playerToReplace.game.turn.time,
            roomId: playerToReplace.room,
            dictionaryValidation: playerToReplace.game.dictionaryValidation,
        });
        botPlayer.score = info.score;
        botPlayer.rack = info.rack;

        if (playerToReplace.game.turn.activePlayer === playerToReplace.name) playerToReplace.game.turn.activePlayer = botPlayer.name;
        else playerToReplace.game.turn.inactivePlayers?.push(botPlayer.name);
        if (playerInRoom[1] === playerToReplace)
            this.gamesHandler.gamePlayers.set(playerToReplace.room, {
                gameInfo: this.gamesHandler.gamePlayers.get(playerToReplace.room)?.gameInfo as GameScrabbleInformation,
                players: [playerInRoom[0], botPlayer],
            });
        else
            this.gamesHandler.gamePlayers.set(playerToReplace.room, {
                gameInfo: this.gamesHandler.gamePlayers.get(playerToReplace.room)?.gameInfo as GameScrabbleInformation,
                players: [botPlayer, playerInRoom[1]],
            });
        this.updateNewBot(socket, playerToReplace.game, playerToReplace.room, botPlayer);
    }

    private async generateBotName(oldName: string): Promise<string> {
        const playerBotList = await this.virtualPlayerStorage.getBeginnerBot();
        let botName = oldName;
        while (oldName.toString().toLowerCase() === botName.toString().toLowerCase()) {
            botName = playerBotList[Math.floor(Math.random() * playerBotList.length)].username;
        }
        return botName;
    }

    private updateNewBot(socket: Socket, game: Game, roomId: string, botPlayer: Player) {
        game.isModeSolo = true;
        (botPlayer as BeginnerBot).setGame(game);
        (botPlayer as BeginnerBot).start();
        this.gamesHandler.updatePlayerInfo(roomId, game);
    }

    private disconnect(socket: Socket) {
        if (!this.gamesHandler.players.has(socket.id)) return;
        const player = this.gamesHandler.players.get(socket.id) as Player;
        const room = player.room;
        if (this.gamesHandler.gamePlayers.get(player.room)?.players !== undefined && !player.game.isGameFinish) {
            this.waitBeforeDisconnect(socket);
            return;
        }
        socket.leave(room);
        this.gamesHandler.players.delete(socket.id);
        this.socketManager.emitRoom(room, SocketEvents.UserDisconnect);
    }

    private waitBeforeDisconnect(socket: Socket) {
        let tempTime = 5;
        setInterval(() => {
            tempTime = tempTime - 1;
            if (tempTime === 0) {
                this.abandonGame(socket);
            }
        }, SECOND);
    }

    private endGame(socketId: string) {
        const player = this.gamesHandler.players.get(socketId) as Player;
        if (this.gamesHandler.gamePlayers.get(player.room)?.players !== undefined && !player.game.isGameFinish) {
            this.gameEnded.next(player.room);
            player.game.isGameFinish = true;
            this.socketManager.emitRoom(player.room, SocketEvents.GameEnd);
            this.gamesHandler.gamePlayers.delete(player.room);
        }
    }

    private async sendHighScore(socketId: string) {
        const player = this.gamesHandler.players.get(socketId) as Player;
        await this.scoreStorage.addTopScores({
            username: player.name,
            type: player.game.gameMode,
            score: player.score,
        });
    }

    private async userConnected(socketId: string[], roomId: string) {
        const player1Room = this.gamesHandler.players.get(socketId[0])?.room;
        const player2Room = this.gamesHandler.players.get(socketId[1])?.room;
        if (player1Room === roomId && player2Room === roomId) {
            this.endGame(socketId[0]);
            await this.sendHighScore(socketId[0]);
            await this.sendHighScore(socketId[1]);
            return;
        }
        if (player1Room === roomId) {
            this.endGame(socketId[0]);
            await this.sendHighScore(socketId[0]);
            return;
        }
        if (player2Room === roomId) {
            this.endGame(socketId[1]);
            await this.sendHighScore(socketId[1]);
        }
    }
}
