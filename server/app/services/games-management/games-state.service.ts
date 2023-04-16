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
import { ChatHandlerService } from '@app/services/client-utilities/chat-handler.service';
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
const ERROR_REPLACING_BOT = 'Error trying to replace the bot';

@Service()
export class GamesStateService {
    addBotSubject: Subject<BeginnerBot>;

    constructor(
        private accountStorage: AccountStorageService,
        private gamesHandler: GamesHandlerService,
        private chatHandler: ChatHandlerService,
        private socketManager: SocketManager,
        private scoreStorage: ScoreStorageService,
        private userStatsStorage: UserStatsStorageService,
        private historyStorageService: HistoryStorageService, // private virtualPlayerStorage: VirtualPlayersStorageService,
    ) {
        this.addBotSubject = new Subject<BeginnerBot>();
    }

    initSocketsEvents(): void {
        // LEAVE GAME
        this.socketManager.io(SocketEvents.Disconnect, (server: Server, socket: Socket) => {
            this.abandonGame(socket, server);
        });
        this.socketManager.io(SocketEvents.AbandonGame, async (server: Server, socket: Socket) => {
            await this.abandonGame(socket, server);
        });

        // OBSERVER
        this.socketManager.io(SocketEvents.JoinAsObserver, (server: Server, socket: Socket, botID: string) => {
            this.joinAsObserver(server, socket, botID);
        });

        // SYNCHRONIZATION
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
            this.gamesHandler.addPlayer(player);
            if (player.player.type !== PlayerType.Observer) {
                game.letterReserve.generateLetters(MAX_QUANTITY, player.rack);
            }
        });

        game.turn.determineStartingPlayer(gamePlayers);

        server.to(room.id).emit(SocketEvents.GameAboutToStart, {
            gameboard: game.gameboard.toStringArray(),
            players: this.gamesHandler.getPlayersInfos(room.id),
            activePlayer: game.turn.activePlayer,
        } as GameInfo);

        server.to(room.id).emit(SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
        game.turn.start();

        // Sketchy bot turn
        if (game.turn.activePlayer && !game.turn.activePlayer?.email) {
            game.turn.endTurn.next(game.turn.activePlayer);
        }
    }

    addObserver(server: Server, roomId: string, player: RoomPlayer): void {
        const gamePlayers: GamePlayer[] = this.gamesHandler.getPlayersInRoom(roomId);
        const socket: Socket | undefined = this.socketManager.getSocketFromId(player.socketId);
        if (!socket) return;

        const newGamePlayer = new GamePlayer(player);
        newGamePlayer.game = gamePlayers[0].game;

        this.gamesHandler.addPlayer(newGamePlayer);
        socket.emit(SocketEvents.GameAboutToStart, {
            gameboard: newGamePlayer.game.gameboard.toStringArray(),
            players: this.gamesHandler.getPlayersInfos(roomId),
            activePlayer: newGamePlayer.game.turn.activePlayer,
        });
        server.to(roomId).emit(SocketEvents.PublicViewUpdate, {
            gameboard: newGamePlayer.game.gameboard.toStringArray(),
            players: this.gamesHandler.getPlayersInfos(roomId),
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
                    break;
                }
                case PlayerType.Bot: {
                    if (roomPlayer.type !== PlayerType.Bot) return;
                    let newBot: Bot;
                    if (room.difficulty === GameDifficulty.Easy) {
                        newBot = new BeginnerBot(roomPlayer, {
                            timer: room.timer,
                            roomId: room.id,
                            dictionaryValidation: game.dictionaryValidation as DictionaryValidation,
                        });
                    } else if (room.difficulty === GameDifficulty.Hard) {
                        newBot = new ExpertBot(roomPlayer, {
                            timer: room.timer,
                            roomId: room.id,
                            dictionaryValidation: game.dictionaryValidation as DictionaryValidation,
                        });
                    } else {
                        newBot = new ScoreRelatedBot(roomPlayer, {
                            timer: room.timer,
                            roomId: room.id,
                            dictionaryValidation: game.dictionaryValidation as DictionaryValidation,
                        });
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
        });
        if (room.difficulty === GameDifficulty.ScoreBased) this.setUpScoreRelatedBots(gamePlayers);
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

    private async setUpScoreRelatedBots(gamePlayers: GamePlayer[]): Promise<void> {
        // Find average player score
        let totalScore = 0;
        let numberOfPlayers = 0;
        for (const player of gamePlayers) {
            if (player.player.type === PlayerType.User) {
                numberOfPlayers += 1;
                const userStats = await this.userStatsStorage.getUserStats(player.player.user._id);
                totalScore += userStats.ranking;
            }
        }
        const avgScore = totalScore / numberOfPlayers;
        for (const player of gamePlayers) {
            if (player.player.type === PlayerType.Bot) {
                (player as ScoreRelatedBot).setupScoreProbs(avgScore);
            }
        }
    }

    private calculateEndGameScore(roomID: string): void {
        const players = this.gamesHandler.getPlayersInRoom(roomID);
        const game = players.find((gamePlayer: GamePlayer) => gamePlayer.player.type === PlayerType.User)?.game;
        if (!game || !players) return;

        if (game.turn.skipCounter === MAX_SKIP) {
            players.forEach((player) => {
                player.deductPoints();
            });
        }

        if (this.playerHasEmptyRack(players)) {
            const finishingPlayer = this.returnEmptyRackPlayer(players) as GamePlayer;
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

    private playerHasEmptyRack(players: GamePlayer[]): boolean {
        return players.filter((player) => player.player.type !== PlayerType.Observer && player.rackIsEmpty()).length > 0;
    }
    private returnEmptyRackPlayer(players: GamePlayer[]): GamePlayer | undefined {
        return players.find((player) => player.player.type !== PlayerType.Observer && player.rackIsEmpty());
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
            this.gamesHandler.getPlayersInRoom(room.id),
            dictionaryContainer.dictionaryValidation,
            dictionaryContainer.letterPlacement,
            dictionaryContainer.wordSolver,
        );
    }

    private changeTurn(roomId: string) {
        const players = this.gamesHandler.getPlayersInRoom(roomId);
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

    private async abandonGame(socket: Socket, server: Server): Promise<void> {
        const gamePlayer = this.gamesHandler.getPlayer(socket.id);
        if (!gamePlayer) return;

        this.chatHandler.leaveGameChatRoom(socket, gamePlayer.player.roomId);
        const room = gamePlayer.player.roomId;
        this.gamesHandler.removePlayerFromSocketId(socket.id);
        socket.leave(gamePlayer.player.roomId);
        if (
            !gamePlayer.game.isModeSolo &&
            this.gamesHandler.getPlayersInRoom(room).filter((player) => player.player.type === PlayerType.User).length > 0
        ) {
            this.socketManager.emitRoom(room, SocketEvents.UserDisconnect);
            // TODO : Repair and make that better for 4 players and bots

            if (gamePlayer.player.type !== PlayerType.Observer) {
                const bot = this.replacePlayerWithBot(gamePlayer as RealPlayer);
                this.gamesHandler.addPlayer(bot);
                this.addBotSubject.next(bot);
                server.to(bot.player.roomId).emit(SocketEvents.PublicViewUpdate, {
                    gameboard: bot.game.gameboard.toStringArray(),
                    players: this.gamesHandler.getPlayersInfos(bot.player.roomId),
                    activePlayer: bot.game.turn.activePlayer,
                });
            }

            // TODO: Update room
            return;
        }
        // TODO: What to do if there are still observers in game ?
        gamePlayer.game.abandon();
        // this.gameEnded.next(room);
    }

    private async endGame(roomId: string) {
        const gamePlayers = this.gamesHandler.getPlayersInRoom(roomId);
        if (gamePlayers.length === 0 && gamePlayers[0].game.isGameFinish) return;

        gamePlayers[0].game.isGameFinish = true;
        this.updatePlayersStats(gamePlayers);

        const winningPlayer = this.getWinnerPlayer(gamePlayers);
        console.log('kicking players');
        gamePlayers.forEach((g: GamePlayer) => {
            const socket = this.socketManager.getSocketFromId(g.player.socketId);
            if (!socket) return;
            socket.emit(SocketEvents.GameEnd, winningPlayer.getInformation());
        });
        this.gamesHandler.removeRoom(roomId);
    }

    private async broadcastHighScores(roomId: string): Promise<void> {
        const players = this.gamesHandler.getPlayersInRoom(roomId);

        if (players.length > 0) await this.endGame(roomId);

        for (const player of players) {
            await this.sendHighScore(player.player);
        }
    }

    private async sendHighScore(player: RoomPlayer) {
        const gamePlayer = this.gamesHandler.getPlayer(player.socketId);
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
        this.socketManager.emitRoom(room.id, SocketEvents.PublicViewUpdate, {
            gameboard: game.gameboard.toStringArray(),
            players: this.gamesHandler.getPlayersInfos(room.id),
            activePlayer: game.turn.activePlayer,
        });
    }

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
        const observer = this.gamesHandler.getPlayer(socketID) as GamePlayer;
        if (!observer) return;

        const bot = this.gamesHandler.getBot(botID);
        if (!bot) {
            // TODO: Socket event to notify observer he cannot replace bot
            socket.emit(SocketEvents.CannotReplaceBot, ERROR_REPLACING_BOT);
            return;
        }

        observer.player.type = PlayerType.User;
        const newPlayer: RealPlayer = this.replaceBotWithObserver(observer.player, bot as Bot);

        // Update gamesHandler player list
        this.gamesHandler.removePlayerFromId(bot.player.user._id);
        this.gamesHandler.removePlayerFromId(observer.player.user._id);

        const botTurnIndex: number | undefined = this.gamesHandler
            .getPlayersInRoom(newPlayer.player.roomId)[0]
            .game.turn.inactivePlayers?.findIndex((p: IUser) => p._id === bot.player.user._id);
        if (!botTurnIndex) return;
        const turnObj = this.gamesHandler.getPlayersInRoom(newPlayer.player.roomId)[0].game.turn;
        if (turnObj.activePlayer === bot.player.user) turnObj.activePlayer = newPlayer.player.user;
        else {
            this.gamesHandler.getPlayersInRoom(newPlayer.player.roomId)[0].game.turn.inactivePlayers?.splice(botTurnIndex, 1);
            this.gamesHandler.getPlayersInRoom(newPlayer.player.roomId)[0].game.turn.inactivePlayers?.push(observer.player.user);
        }
        this.gamesHandler.addPlayer(newPlayer);

        // TODO: Update room with roomID
        server.to(newPlayer.player.roomId).emit(SocketEvents.PublicViewUpdate, {
            gameboard: newPlayer.game.gameboard.toStringArray(),
            players: this.gamesHandler.getPlayersInfos(newPlayer.player.roomId),
            activePlayer: newPlayer.game.turn.activePlayer,
        });
    }

    private replaceBotWithObserver(observer: RoomPlayer, bot: Bot): RealPlayer {
        bot.unsubscribeObservables();
        return bot.convertToRealPlayer(observer);
    }

    private replacePlayerWithBot(player: RealPlayer): BeginnerBot {
        const game = player.game;
        const oldIUser = player.player.user;
        const bot = player.convertPlayerToBot();
        bot.player.socketId = '';
        bot.player.type = PlayerType.Bot;
        bot.setGame(game);
        if (bot.game.turn.activePlayer?._id === oldIUser._id) bot.game.turn.activePlayer = bot.player.user;
        else {
            const indexOfUser = bot.game.turn.inactivePlayers?.indexOf(oldIUser);
            bot.game.turn.inactivePlayers?.splice(indexOfUser as number, 1, bot.player.user);
        }
        bot.start();
        bot.game.turn.endTurn.next(game.turn.activePlayer);
        return bot;
    }

    private addGameEventHistory(player: RealPlayer, gameWon: boolean) {
        const userID = player.player.user._id;
        const gameDate = player.game.beginningTime;
        this.accountStorage.addUserEventHistory(userID, HistoryActions.Game, gameDate, gameWon);
    }
}
