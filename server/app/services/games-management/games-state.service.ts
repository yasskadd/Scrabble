/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
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
import { DictionaryContainer } from '@app/interfaces/dictionary-container';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { HistoryStorageService } from '@app/services/database/history-storage.service';
import { ScoreStorageService } from '@app/services/database/score-storage.service';
import { UserStatsStorageService } from '@app/services/database/user-stats-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { DragInfos } from '@common/interfaces/drag-infos';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { GameRoom } from '@common/interfaces/game-room';
import { GameInfo } from '@common/interfaces/game-state';
import { PlayerInformation } from '@common/interfaces/player-information';
import { RoomPlayer } from '@common/interfaces/room-player';
import { SimpleLetterInfos } from '@common/interfaces/simple-letter-infos';
import { IUser } from '@common/interfaces/user';
import { GameDifficulty } from '@common/models/game-difficulty';
import { GameMode } from '@common/models/game-mode';
import { HistoryActions } from '@common/models/history-actions';
import { PlayerType } from '@common/models/player-type';
import { Subject } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { GamesHandlerService } from './games-handler.service';

const MAX_SKIP = 6;
const SECOND = 1000;
const ERROR_REPLACING_BOT = 'Error trying to replace the bot';

@Service()
export class GamesStateService {
    gameEnded: Subject<string>;

    constructor(
        private accountStorage: AccountStorageService,
        private gamesHandler: GamesHandlerService,
        private socketManager: SocketManager,
        private scoreStorage: ScoreStorageService,
        private userStatsStorage: UserStatsStorageService,
        private historyStorageService: HistoryStorageService, // private virtualPlayerStorage: VirtualPlayersStorageService,
    ) {
        this.gameEnded = new Subject();

        // this.gameEnded.subscribe((room) => {
        //     const gameInfo = this.formatGameInfo(room);
        //     if (!gameInfo) return;

        //     this.historyStorageService.addToHistory(gameInfo).then();
        // });
    }

    initSocketsEvents(): void {
        this.socketManager.io(SocketEvents.Disconnect, (server: Server, socket: Socket) => {
            this.disconnect(server, socket);
        });
        this.socketManager.io(SocketEvents.AbandonGame, async (server: Server, socket: Socket) => {
            await this.abandonGame(server, socket);
        });
        this.socketManager.io(SocketEvents.QuitGame, (server: Server, socket: Socket) => {
            this.disconnect(server, socket);
        });
        this.socketManager.io(SocketEvents.JoinAsObserver, (server: Server, socket: Socket, botID: string) => {
            this.joinAsObserver(server, socket, botID);
        });
        this.socketManager.io(SocketEvents.SendDrag, (server: Server, socket: Socket, dragInfos: DragInfos) => {
            server.to(dragInfos.roomId).emit(SocketEvents.DragEvent, dragInfos);
        });
        this.socketManager.io(SocketEvents.LetterTaken, (server: Server, socket: Socket, tile: SimpleLetterInfos) => {
            server.to(tile.roomId).emit(SocketEvents.LetterTaken, tile);
        });
        this.socketManager.io(SocketEvents.LetterPlaced, (server: Server, socket: Socket, tile: SimpleLetterInfos) => {
            server.to(tile.roomId).emit(SocketEvents.LetterPlaced, tile);
        });
    }

    async createGame(server: Server, room: GameRoom) {
        const game = this.createNewGame(room);
        if (!game) return;

        const gamePlayers: GamePlayer[] = this.initPlayers(game, room);

        await this.setupGameSubscriptions(room, game);

        gamePlayers.forEach((player: GamePlayer) => {
            this.gamesHandler.players.push(player);
            if (player.player.type !== PlayerType.Observer) {
                game.letterReserve.generateLetters(MAX_QUANTITY, player.rack);
            }
        });

        game.turn.determineStartingPlayer(gamePlayers);

        const playersInfo: PlayerInformation[] = this.gamesHandler.players.map((player: GamePlayer) => {
            return player.getInformation();
        });

        server.to(room.id).emit(SocketEvents.GameAboutToStart, {
            gameboard: game.gameboard.toStringArray(),
            players: playersInfo,
            activePlayer: game.turn.activePlayer,
        } as GameInfo);
        server.to(room.id).emit(SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
        game.turn.start();
        if (game.turn.activePlayer && !game.turn.activePlayer?.email) {
            game.turn.endTurn.next(game.turn.activePlayer);
        }
    }

    addObserver(server: Server, roomId: string, player: RoomPlayer): void {
        const gamePlayers: GamePlayer[] = this.gamesHandler.getPlayersFromRoomId(roomId);
        const socket: Socket | undefined = this.socketManager.getSocketFromId(player.socketId);
        if (!socket) return;

        const newGamePlayer = new GamePlayer(player);
        newGamePlayer.game = gamePlayers[0].game;

        this.gamesHandler.players.push(newGamePlayer);
        socket.emit(SocketEvents.GameAboutToStart, {
            gameboard: newGamePlayer.game.gameboard.toStringArray(),
            players: this.gamesHandler.players
                .filter((p: GamePlayer) => p.player.roomId === roomId)
                .map((p: GamePlayer) => {
                    return p.getInformation();
                }),
            activePlayer: newGamePlayer.game.turn.activePlayer,
        });
        server.to(roomId).emit(SocketEvents.PublicViewUpdate, {
            gameboard: newGamePlayer.game.gameboard.toStringArray(),
            players: this.gamesHandler.players
                .filter((p: GamePlayer) => p.player.roomId === roomId)
                .map((p: GamePlayer) => {
                    return p.getInformation();
                }),
            activePlayer: newGamePlayer.game.turn.activePlayer,
        });
    }

    private initPlayers(game: Game, room: GameRoom): GamePlayer[] {
        const gamePlayers: GamePlayer[] = [];

        room.players.forEach((roomPlayer: RoomPlayer) => {
            switch (roomPlayer.type) {
                case PlayerType.User: {
                    const newPlayer: RealPlayer = new RealPlayer(roomPlayer);

                    newPlayer.game = game;
                    gamePlayers.push(newPlayer);

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
                        }, 500);
                    }
                    newBot.game = game;
                    gamePlayers.push(newBot);

                    newBot.setGame(game);
                    newBot.start();

                    break;
                }
                case PlayerType.Observer: {
                    const newGamePlayer = new GamePlayer(roomPlayer);

                    newGamePlayer.game = game;
                    gamePlayers.push(newGamePlayer);

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
            if (!game.turn.activePlayer) {
                this.calculateEndGameScore(room.id);
                await this.broadcastHighScores(room.id);
            } else this.changeTurn(room.id);
            this.sendPublicViewUpdate(game, room);
        });

        game.turn.countdown.subscribe((timer: number) => {
            this.sendTimer(room.id, timer);
        });
    }

    private calculateEndGameScore(roomID: string): void {
        const players = this.gamesHandler.getPlayersFromRoomId(roomID);
        const game = players.find((gamePlayer: GamePlayer) => gamePlayer.player.type === PlayerType.User)?.game;
        if (!game || !players) return;

        if (game.turn.skipCounter === MAX_SKIP) {
            players.forEach((player) => {
                player.deductPoints();
            });
        }

        if (
            players.filter((player: GamePlayer) => {
                if (player.player.type === PlayerType.User) {
                    return player.rackIsEmpty();
                }
                return false;
            }).length > 0
        ) {
            const finishingPlayer = players.find((player: GamePlayer) => {
                if (player.player.type === PlayerType.User) {
                    player.rackIsEmpty();
                }
            });
            if (!finishingPlayer) return;
            players.filter((player: GamePlayer) => {
                if (player.player.user.username !== finishingPlayer.player.user.username) {
                    player.deductPoints();
                    finishingPlayer.addPoints(player.rack);
                }
            });
        }
        this.addGameEventToPlayers(players);
    }

    private addGameEventToPlayers(players: GamePlayer[]) {
        const realPlayers = players.filter((player) => player.player.type === PlayerType.User);
        const winnerPlayer = players.reduce((prev, current) => {
            return prev.score > current.score ? prev : current;
        });
        realPlayers.forEach((player: GamePlayer) => {
            if (player.player.type === PlayerType.User) {
                if (player.player.user.username === winnerPlayer.player.user.username) this.addGameEventHistory(player as RealPlayer, true);
                else this.addGameEventHistory(player as RealPlayer, false);
            }
        });
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

        this.socketManager.emitRoom(roomId, SocketEvents.NextTurn, gameInfo);
    }

    private sendTimer(roomId: string, timer: number) {
        this.socketManager.emitRoom(roomId, SocketEvents.TimerClientUpdate, timer);
    }

    private async abandonGame(server: Server, socket: Socket): Promise<void> {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id);
        if (!gamePlayer) return;

        console.log('user ' + gamePlayer.player.user + ' is abandoning');

        await this.userStatsStorage.updatePlayerStats(this.formatGameInfo(gamePlayer));

        this.gamesHandler.removePlayerFromSocketId(socket.id);
        const bot = this.replacePlayerWithBot(gamePlayer as RealPlayer);

        socket.leave(bot.player.roomId);
        this.gamesHandler.players.push(bot);

        server.to(bot.player.roomId).emit(SocketEvents.PublicViewUpdate, {
            gameboard: bot.game.gameboard.toStringArray(),
            players: this.gamesHandler.getPlayersFromRoomId(bot.player.roomId).map((p: GamePlayer) => {
                return p.getInformation();
            }),
            activePlayer: bot.game.turn.activePlayer,
        });

        if (gamePlayer.game.isModeSolo || !this.gamesHandler.usersRemaining(gamePlayer.player.roomId)) {
            console.log('removing room');
            gamePlayer.game.abandon();
            this.gamesHandler.getPlayersFromRoomId(gamePlayer.player.roomId).forEach((player: GamePlayer) => {
                this.socketManager.getSocketFromId(player.player.socketId)?.leave(bot.player.roomId);
            });
            this.gamesHandler.removeRoomFromRoomId(gamePlayer.player.roomId);
            gamePlayer.game.abandon();

            return;
        }
        // TODO: What to do if there are still observers in game ?

        // this.gameEnded.next(room);
    }

    // private async switchToSolo(playerToReplace: GamePlayer): Promise<void> {
    //     const info = playerToReplace.getInformation();
    //     if (!info) return;
    //     const players = this.gamesHandler.getPlayersFromRoomId(playerToReplace.player.roomId);
    //     if (!players) return;
    //
    //     const botName = await this.generateBotName(
    //         players[1] === playerToReplace ? players[0].player.user.username : players[1].player.user.username,
    //     );
    //
    //     // TODO : Add bot image here
    //     const botPlayer = new BeginnerBot(
    //         false,
    //         {
    //             user: {
    //                 username: botName,
    //                 password: 'null',
    //                 profilePicture: {
    //                     name: 'bot-image',
    //                     isDefaultPicture: true,
    //                 },
    //             },
    //             socketId: '',
    //             roomId: '',
    //             type: PlayerType.Bot,
    //             isCreator: false,
    //         },
    //         {
    //             timer: playerToReplace.game.turn.time,
    //             roomId: playerToReplace.player.roomId,
    //             dictionaryValidation: playerToReplace.game.dictionaryValidation,
    //         },
    //     );
    //     botPlayer.score = info.score;
    //     botPlayer.rack = info.rack;
    //
    //     if (playerToReplace.game.turn.activePlayer === playerToReplace.player.user) playerToReplace.game.turn.activePlayer = botPlayer.player.user;
    //     else {
    //         this.findAndDeleteElementFromArray(playerToReplace.game.turn.inactivePlayers, playerToReplace.player.user);
    //         playerToReplace.game.turn.inactivePlayers?.push(botPlayer.player.user);
    //     }

    // TODO : Do we still need that?
    // const gameRoom = this.gamesHandler.gamePlayers.get(playerToReplace.room)?.gameRoom;
    // if (!gameRoom) return;
    //
    // if (players[1] === playerToReplace)
    //     this.gamesHandler.gamePlayers.set(playerToReplace.gameRoom, {
    //         gameRoom,
    //         players: [players[0], botPlayer],
    //     });
    // else
    //     this.gamesHandler.gamePlayers.set(playerToReplace.gameRoom, {
    //         gameRoom,
    //         players: [botPlayer, players[1]],
    //     });
    //
    // this.updateNewBot(playerToReplace.game, playerToReplace.gameRoom, botPlayer);
    // }
    //
    // private async generateBotName(oldName: string): Promise<string> {
    //     const playerBotList = await this.virtualPlayerStorage.getBeginnerBot();
    //     let botName = oldName;
    //     while (oldName.toString().toLowerCase() === botName.toString().toLowerCase()) {
    //         botName = playerBotList[Math.floor(Math.random() * playerBotList.length)].username;
    //     }
    //     return botName;
    // }

    // private updateNewBot(game: Game, roomId: string, botPlayer: GamePlayer) {
    //     game.isModeSolo = true;
    //     (botPlayer as BeginnerBot).setGame(game);
    //     (botPlayer as BeginnerBot).start();
    //     this.gamesHandler.updatePlayersInfo(roomId, game);
    // }

    private disconnect(server: Server, socket: Socket) {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socket.id);
        if (!gamePlayer) return;

        if (this.gamesHandler.getPlayersFromRoomId(gamePlayer.player.roomId).length > 0 && !gamePlayer.game.isGameFinish) {
            const player = this.gamesHandler.players.find((realPlayer) => realPlayer.player.socketId === socket.id);
            if (player) {
                const bot = this.replacePlayerWithBot(player as RealPlayer);
                this.gamesHandler.removePlayerFromSocketId(socket.id);
                this.gamesHandler.players.push(bot);
                // TODO: Update room that a new bot has replaced the player
            }
            this.waitBeforeDisconnect(server, socket);
            return;
        }

        socket.leave(gamePlayer.player.roomId);
        this.gamesHandler.removePlayerFromSocketId(socket.id);
        this.socketManager.emitRoom(gamePlayer.player.roomId, SocketEvents.UserDisconnect);
    }

    private waitBeforeDisconnect(server: Server, socket: Socket) {
        let tempTime = 5;
        setInterval(async () => {
            tempTime = tempTime - 1;
            if (tempTime === 0) {
                await this.abandonGame(server, socket);
            }
        }, SECOND);
    }
    private async endGame(socketId: string) {
        const gamePlayer = this.gamesHandler.getPlayerFromSocketId(socketId);
        if (!gamePlayer) return;
        const gamePlayers = this.gamesHandler.getPlayersFromRoomId(gamePlayer.player.roomId);
        if (gamePlayers.length === 0 && gamePlayer.game.isGameFinish) return;

        this.gameEnded.next(gamePlayer.player.roomId);
        gamePlayer.game.isGameFinish = true;
        this.updatePlayersStats(gamePlayers);

        console.log('kicking players');
        gamePlayers.forEach((g: GamePlayer) => {
            const socket = this.socketManager.getSocketFromId(g.player.socketId);
            if (!socket) return;

            console.log(socket.id);
            socket.emit(SocketEvents.GameEnd);
        });
        this.gamesHandler.removeRoomFromRoomId(gamePlayer.player.roomId);
    }

    private async broadcastHighScores(roomId: string): Promise<void> {
        const players = this.gamesHandler.getPlayersFromRoomId(roomId);

        if (players.length > 0) await this.endGame(roomId);

        for (const player of players) {
            await this.sendHighScore(player.player);
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

    private updatePlayersStats(gamePlayers: GamePlayer[]) {
        const gameWinnerPlayer = this.getWinnerPlayer(gamePlayers);
        gamePlayers.forEach(async (player) => {
            if (player.player.type === PlayerType.Bot || player.player.type === PlayerType.Observer) return;
            const playerWonGame = player.player.socketId === gameWinnerPlayer.player.socketId;
            const gameHistoryInfo = this.formatGameInfo(player, playerWonGame);
            await this.userStatsStorage.updatePlayerStats(gameHistoryInfo);
            await this.historyStorageService.addToHistory(gameHistoryInfo);
        });
    }

    private getWinnerPlayer(players: GamePlayer[]): GamePlayer {
        return players.reduce((acc, cur) => {
            return cur.score > acc.score ? cur : acc;
        });
    }

    private sendPublicViewUpdate(game: Game, room: GameRoom) {
        const playersInfo: PlayerInformation[] = this.gamesHandler.players.map((player: GamePlayer) => {
            return player.getInformation();
        });

        this.socketManager.emitRoom(room.id, SocketEvents.PublicViewUpdate, {
            gameboard: game.gameboard.toStringArray(),
            players: playersInfo,
            activePlayer: game.turn.activePlayer,
        });
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

    private formatGameInfo(player: GamePlayer, playerWonGame = false, abandoned = false): GameHistoryInfo {
        // const players = this.gamesHandler.getPlayersFromRoomId(player.player.roomId);
        // if (!players) return;

        const endTime = new Date();
        return {
            roomId: player.player.roomId,
            mode: player.game.gameMode,
            playerWonGame,
            abandoned,
            beginningTime: player.game.beginningTime,
            endTime,
            duration: Math.abs(endTime.getTime() - player.game.beginningTime.getTime()),
            playerId: player.player.user._id,
            playerScore: player.score,
            // gameResult: players.map<PlayerGameResult>((player: GamePlayer) => {
            //     return { name: player.player.user.username, score: player.score };
            // }),
        } as GameHistoryInfo;
    }

    private joinAsObserver(server: Server, socket: Socket, botID: string): void {
        const socketID = socket.id;
        const observer = this.gamesHandler.getPlayerFromSocketId(socketID) as GamePlayer;
        if (!observer) return;

        const bot = this.gamesHandler.players.find((player) => player.player.user._id === botID);
        if (!bot) {
            // TODO: Socket event to notify observer he cannot replace bot
            socket.emit(SocketEvents.CannotReplaceBot, ERROR_REPLACING_BOT);
            return;
        }

        observer.player.type = PlayerType.User;
        const newPlayer: RealPlayer = this.replaceBotWithObserver(observer.player, bot as Bot);
        // Update gamesHandler player list
        const botIndex = this.gamesHandler.players.findIndex((player: GamePlayer) => player.player.user._id === bot.player.user._id);
        this.gamesHandler.players.splice(botIndex, 1);
        const obsIndex = this.gamesHandler.players.findIndex((player: GamePlayer) => player.player.user._id === observer.player.user._id);
        this.gamesHandler.players.splice(obsIndex, 1);
        const botTurnIndex: number | undefined = this.gamesHandler.players[0].game.turn.inactivePlayers?.findIndex(
            (p: IUser) => p._id === bot.player.user._id,
        );
        if (!botTurnIndex) return;
        this.gamesHandler.players[0].game.turn.inactivePlayers?.splice(botTurnIndex, 1);
        this.gamesHandler.players[0].game.turn.inactivePlayers?.push(observer.player.user);
        this.gamesHandler.players.push(newPlayer);

        // TODO: Update room with roomID
        server.to(newPlayer.player.roomId).emit(SocketEvents.PublicViewUpdate, {
            gameboard: newPlayer.game.gameboard.toStringArray(),
            players: this.gamesHandler.players
                .filter((p: GamePlayer) => p.player.roomId === newPlayer.player.roomId)
                .map((p: GamePlayer) => {
                    return p.getInformation();
                }),
            activePlayer: newPlayer.game.turn.activePlayer,
        });
    }

    private replaceBotWithObserver(observer: RoomPlayer, bot: Bot): RealPlayer {
        bot.unsubscribeObservables();
        return bot.convertToRealPlayer(observer);
    }

    private replacePlayerWithBot(player: RealPlayer): BeginnerBot {
        const bot = player.convertPlayerToBot();
        bot.player.socketId = '';
        bot.player.type = PlayerType.Bot;
        bot.setGame(player.game);
        bot.start();
        return bot;
    }

    private addGameEventHistory(player: RealPlayer, gameWon: boolean) {
        console.log('ENTERED ADD GAME EVENT HISTORY');
        const userID = player.player.user._id;
        const gameDate = player.game.beginningTime;
        this.accountStorage.addUserEventHistory(userID, HistoryActions.Game, gameDate, gameWon);
    }
}
