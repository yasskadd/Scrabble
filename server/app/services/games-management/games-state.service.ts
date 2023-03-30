/* eslint-disable max-lines */
import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { BeginnerBot } from '@app/classes/player/beginner-bot.class';
import { Bot } from '@app/classes/player/bot.class';
import { ExpertBot } from '@app/classes/player/expert-bot.class';
import { GamePlayer } from '@app/classes/player/player.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { ScoreRelatedBot } from '@app/classes/player/score-related-bot.class';
import { Turn } from '@app/classes/turn.class';
import { MAX_QUANTITY } from '@app/constants/letter-reserve';
import { DictionaryContainer } from '@app/interfaces/dictionaryContainer';
import { HistoryStorageService } from '@app/services/database/history-storage.service';
import { ScoreStorageService } from '@app/services/database/score-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { GameHistoryInfo, PlayerGameResult } from '@common/interfaces/game-history-info';
import { GameRoom } from '@common/interfaces/game-room';
import { GameInfo } from '@common/interfaces/game-state';
import { PlayerInformation } from '@common/interfaces/player-information';
import { RoomPlayer } from '@common/interfaces/room-player';
import { GameDifficulty } from '@common/models/game-difficulty';
import { GameMode } from '@common/models/game-mode';
import { PlayerType } from '@common/models/player-type';
import { Subject } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { GamesHandlerService } from './games-handler.service';

const MAX_SKIP = 6;
const SECOND = 1000;
const SECOND_IN_MILLISECOND = 1000;
const SECOND_AND_MINUTE_MAX_VALUE = 60;
const MINIMUM_TWO_UNITS = 10;

@Service()
export class GamesStateService {
    gameEnded: Subject<string>;

    constructor(
        private gamesHandler: GamesHandlerService,
        private socketManager: SocketManager,
        private scoreStorage: ScoreStorageService,
        private historyStorageService: HistoryStorageService, // private virtualPlayerStorage: VirtualPlayersStorageService,
    ) {
        this.gameEnded = new Subject();

        this.gameEnded.subscribe((room) => {
            const gameInfo = this.formatGameInfo(room);
            if (!gameInfo) return;

            this.historyStorageService.addToHistory(gameInfo).then();
        });
    }

    initSocketsEvents(): void {
        this.socketManager.on(SocketEvents.Disconnect, (socket: Socket) => {
            this.disconnect(socket);
        });
        this.socketManager.on(SocketEvents.AbandonGame, (socket: Socket) => {
            this.abandonGame(socket);
        });
        this.socketManager.on(SocketEvents.QuitGame, (socket: Socket) => {
            this.disconnect(socket);
        });
    }

    async createGame(server: Server, room: GameRoom) {
        const game = this.createNewGame(room);
        if (!game) return;

        const gamePlayers: GamePlayer[] = this.initPlayers(game, room);

        await this.setupGameSubscriptions(room, game);

        // start() that was in Game
        gamePlayers.forEach((player: GamePlayer) => {
            this.gamesHandler.players.push(player);
            game.letterReserve.generateLetters(MAX_QUANTITY, player.rack);
        });
        // this.gamesHandler.updatePlayersInfo(room.id, game);

        game.turn.determineStartingPlayer(gamePlayers);

        console.log('sending view update');
        this.sendPublicViewUpdate(server, game, room);
        server.to(room.id).emit(SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
        game.turn.start();
    }

    private initPlayers(game: Game, room: GameRoom): GamePlayer[] {
        const gamePlayers: GamePlayer[] = [];

        room.players.forEach((roomPlayer: RoomPlayer) => {
            switch (roomPlayer.type) {
                case PlayerType.User: {
                    const newPlayer: RealPlayer = new RealPlayer(roomPlayer);

                    gamePlayers.push(newPlayer);
                    newPlayer.game = game;

                    // TODO : Is this usefull?
                    // if (this.gamesHandler.gamePlayers.get(roomPlayer.roomId) === undefined) {
                    //     this.gamesHandler.gamePlayers.set(newPlayer.room, { room, players: [] as GamePlayer[] });
                    //     (this.gamesHandler.gamePlayers.get(newPlayer.room)?.players as GamePlayer[]).push(newPlayer);
                    // }

                    break;
                }
                case PlayerType.Bot: {
                    if (roomPlayer.type !== PlayerType.Bot) return;

                    const dictionaryValidation = (this.gamesHandler.dictionaries.get(room.dictionary) as DictionaryContainer).dictionaryValidation;

                    let newBot: Bot;
                    if (room.difficulty === GameDifficulty.Easy) {
                        newBot = new BeginnerBot(roomPlayer, {
                            timer: room.timer,
                            roomId: room.id,
                            dictionaryValidation: dictionaryValidation as DictionaryValidation,
                        });
                    } else if (room.difficulty === GameDifficulty.Hard) {
                        newBot = new ExpertBot(roomPlayer, {
                            timer: room.timer,
                            roomId: room.id,
                            dictionaryValidation: dictionaryValidation as DictionaryValidation,
                        });
                    } else {
                        newBot = new ScoreRelatedBot(roomPlayer, {
                            timer: room.timer,
                            roomId: room.id,
                            dictionaryValidation: dictionaryValidation as DictionaryValidation,
                        });
                    }
                    newBot.game = game;
                    gamePlayers.push(newBot);

                    newBot.setGame(game);
                    newBot.start();

                    break;
                }
                case PlayerType.Observer: {
                    //     TODO : Implement that
                    break;
                }
                default: {
                    break;
                }
            }

            // TODO : Is this still usefull ?
            //     if (this.gamesHandler.gamePlayers.get(newPlayer.room) === undefined)
            //         this.gamesHandler.gamePlayers.set(newPlayer.room, { room, players: [] as GamePlayer[] });
            //     (this.gamesHandler.gamePlayers.get(newPlayer.room)?.players as GamePlayer[]).push(newPlayer);
        });

        return gamePlayers;
    }

    private async setupGameSubscriptions(room: GameRoom, game: Game) {
        game.turn.endTurn.subscribe(async () => {
            this.calculateEndGameScore(room.id);
            if (!game.turn.activePlayer) {
                await this.broadcastHighScores(room.players, room.id);
            } else this.changeTurn(room.id);
        });

        game.turn.countdown.subscribe((timer: number) => {
            this.sendTimer(room.id, timer);
        });
    }

    private calculateEndGameScore(roomID: string) {
        const players = this.gamesHandler.getPlayersFromRoomId(roomID);
        if (!players) return;

        const game = players.find((gamePlayer: GamePlayer) => gamePlayer.player.type === PlayerType.User)?.game;
        if (!game) return;

        if (game.turn.skipCounter === MAX_SKIP) {
            players.forEach((player) => {
                player.deductPoints();
            });
            return;
        }

        if (players.filter((player: GamePlayer) => player.rackIsEmpty()).length > 0) {
            const finishingPlayer = players.find((player: GamePlayer) => player.rackIsEmpty());
            if (!finishingPlayer) return;

            players.filter((player: GamePlayer) => {
                if (player.player.user.username !== finishingPlayer.player.user.username) {
                    player.deductPoints();
                    finishingPlayer.addPoints(player.rack);
                }
            });
        }
    }

    private createNewGame(room: GameRoom): Game | undefined {
        const dictionaryContainer: DictionaryContainer | undefined = this.gamesHandler.dictionaries.get(room.dictionary);
        if (!dictionaryContainer) return;

        return new Game(
            new Turn(room.timer),
            new LetterReserve(),
            'classique',
            room.mode === GameMode.Solo,
            this.gamesHandler.getPlayersFromRoomId(room.id),
            dictionaryContainer.dictionaryValidation,
            dictionaryContainer.letterPlacement,
            dictionaryContainer.wordSolver,
        );
    }

    private changeTurn(roomId: string) {
        const players = this.gamesHandler.getPlayersFromRoomId(roomId);
        const informations: PlayerInformation[] = [];

        players.forEach((player: GamePlayer) => {
            const information = player.getInformation();
            if (information) {
                informations.push(information);
            }
        });
        if (informations.length === 0) return;

        const gameInfo: GameInfo = {
            gameboard: players[0].game.gameboard.toStringArray(),
            players: informations,
            activePlayer: players[0].game.turn.activePlayer,
        };

        console.log('Next turn');

        this.socketManager.emitRoom(roomId, SocketEvents.NextTurn, gameInfo);
    }

    private sendTimer(roomId: string, timer: number) {
        this.socketManager.emitRoom(roomId, SocketEvents.TimerClientUpdate, timer);
    }

    private abandonGame(socket: Socket): void {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id);
        if (!gamePlayer) return;

        const room = gamePlayer.player.roomId;
        this.gamesHandler.removePlayerFromSocketId(socket.id);

        socket.leave(gamePlayer.player.roomId);
        if (!gamePlayer.game.isModeSolo) {
            this.socketManager.emitRoom(room, SocketEvents.UserDisconnect);
            return;
        }

        gamePlayer.game.abandon();
        this.gameEnded.next(gamePlayer.player.roomId);
        this.gamesHandler.removeRoomFromRoomId(gamePlayer.player.roomId);
    }

    private disconnect(socket: Socket) {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id);
        if (!gamePlayer) return;

        if (this.gamesHandler.getPlayersFromRoomId(gamePlayer.player.roomId).length > 0 && !gamePlayer.game.isGameFinish) {
            this.waitBeforeDisconnect(socket);
            return;
        }

        socket.leave(gamePlayer.player.roomId);
        this.gamesHandler.removePlayerFromSocketId(socket.id);
        this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.UserDisconnect);
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
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socketId);
        if (!gamePlayer) return;
        if (this.gamesHandler.getPlayersFromRoomId(gamePlayer.player.roomId).length === 0 && gamePlayer.game.isGameFinish) return;

        this.gameEnded.next(gamePlayer.player.roomId);
        gamePlayer.game.isGameFinish = true;

        console.log('Game ended');

        this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.GameEnd);
        this.gamesHandler.removeRoomFromRoomId(gamePlayer.player.roomId);
    }

    private async broadcastHighScores(players: RoomPlayer[], roomId: string): Promise<void> {
        const playersInRoom = players.filter((player: RoomPlayer) => {
            const gamePlayer = this.gamesHandler.getPlayerFromSocketId(player.socketId);
            if (!gamePlayer) return;

            if (gamePlayer.player.roomId === roomId) return player.socketId;
            return;
        });

        if (playersInRoom.length !== 0) this.endGame(playersInRoom[0].socketId);

        for (const player of playersInRoom) {
            await this.sendHighScore(player);
        }
    }

    private async sendHighScore(player: RoomPlayer) {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(player.socketId);
        if (!gamePlayer) return;

        await this.scoreStorage.addTopScores({
            username: player.user.username,
            type: gamePlayer.game.gameMode,
            score: gamePlayer.score,
        });
    }

    private sendPublicViewUpdate(server: Server, game: Game, room: GameRoom) {
        const playersInfo: PlayerInformation[] = this.gamesHandler.players.map((player: GamePlayer) => {
            return player.getInformation();
        });

        server.to(room.id).emit(SocketEvents.PublicViewUpdate, {
            gameboard: game.gameboard.toStringArray(),
            players: playersInfo,
            activePlayer: game.turn.activePlayer,
        } as GameInfo);
    }

    // private findAndDeleteElementFromArray(array: any[] | undefined, element: any) {
    //     if (!array) return;
    //
    //     const NOT_FOUND = -1;
    //     const index = array?.indexOf(element);
    //     if (index !== NOT_FOUND) {
    //         array.splice(index as number, 1);
    //     }
    // }

    private formatGameInfo(roomId: string): GameHistoryInfo | undefined {
        const players = this.gamesHandler.getPlayersFromRoomId(roomId);
        if (!players) return;

        const endTime = new Date();
        return {
            mode: players[0].game.gameMode,
            abandoned: players[0].game.isGameAbandoned,
            beginningTime: players[0].game.beginningTime,
            endTime,
            duration: this.computeDuration(players[0].game.beginningTime, endTime),
            gameResult: players.map<PlayerGameResult>((player: GamePlayer) => {
                return { name: player.player.user.username, score: player.score };
            }),
        } as GameHistoryInfo;
    }

    private computeDuration(date1: Date, date2: Date): string {
        const milliseconds = Math.abs(date2.getTime() - date1.getTime());
        const seconds = Math.floor((milliseconds / SECOND_IN_MILLISECOND) % SECOND_AND_MINUTE_MAX_VALUE);
        const minutes = Math.floor(milliseconds / (SECOND_IN_MILLISECOND * SECOND_AND_MINUTE_MAX_VALUE));

        return (minutes < MINIMUM_TWO_UNITS ? '0' + minutes : minutes) + ':' + (seconds < MINIMUM_TWO_UNITS ? '0' + seconds : seconds);
    }
}
