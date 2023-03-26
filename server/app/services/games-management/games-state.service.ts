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
import { DictionaryContainer } from '@app/interfaces/dictionaryContainer';
import { ScoreStorageService } from '@app/services/database/score-storage.service';
import { VirtualPlayersStorageService } from '@app/services/database/virtual-players-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { NUMBER_OF_PLAYERS } from '@common/constants/players';
import { SocketEvents } from '@common/constants/socket-events';
import { PublicViewUpdate } from '@common/interfaces/public-view-update';
import { Subject } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { GamesHandler } from './games-handler.service';
import { GameRoom } from '@common/interfaces/game-room';
import { RoomPlayer } from '@common/interfaces/room-player';
import { GameDifficulty } from '@common/models/game-difficulty';
import { PlayerType } from '@common/models/player-type';
import { GameMode } from '@common/models/game-mode';

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

    async createGame(server: Server, room: GameRoom) {
        const game = this.createNewGame(room);
        if (!game) return;

        this.initPlayers(game, room);

        this.gamesHandler.updatePlayerInfo(room.id, game);
        await this.gameSubscriptions(room, game);

        this.sendPublicViewUpdate(server, game, room.id);
        server.to(room.id).emit(SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve);
    }

    private initPlayers(game: Game, room: GameRoom): void {
        const players: GamePlayer[] = [];

        room.players.forEach((player: RoomPlayer) => {
            const newPlayer: GamePlayer = new RealPlayer(player.user.username);
            newPlayer.room = player.roomId;
            this.gamesHandler.players.set(player.socketId, newPlayer);

            players.push(newPlayer);

            if (this.gamesHandler.gamePlayers.get(player.roomId) === undefined) {
                this.gamesHandler.gamePlayers.set(newPlayer.room, { room, players: [] as GamePlayer[] });
                (this.gamesHandler.gamePlayers.get(newPlayer.room)?.players as GamePlayer[]).push(newPlayer);
            }
        });

        while (players.length !== NUMBER_OF_PLAYERS) {
            if (room.difficulty !== undefined) {
                const dictionaryValidation = (this.gamesHandler.dictionaries.get(room.dictionary) as DictionaryContainer).dictionaryValidation;

                let newPlayer: GamePlayer;
                if (room.difficulty === GameDifficulty.Easy) {
                    newPlayer = new BeginnerBot(false, room.players[players.length].user.username, {
                        timer: room.timer,
                        roomId: room.id,
                        dictionaryValidation: dictionaryValidation as DictionaryValidation,
                    });
                    players.push(newPlayer);
                } else if (room.difficulty === GameDifficulty.Hard) {
                    newPlayer = new ExpertBot(false, room.players[players.length].user.username, {
                        timer: room.timer,
                        roomId: room.id,
                        dictionaryValidation: dictionaryValidation as DictionaryValidation,
                    });
                    players.push(newPlayer);
                } else {
                    newPlayer = new ScoreRelatedBot(false, room.players[players.length].user.username, {
                        timer: room.timer,
                        roomId: room.id,
                        dictionaryValidation: dictionaryValidation as DictionaryValidation,
                    });
                }
                if (this.gamesHandler.gamePlayers.get(newPlayer.room) === undefined)
                    this.gamesHandler.gamePlayers.set(newPlayer.room, { room, players: [] as GamePlayer[] });
                (this.gamesHandler.gamePlayers.get(newPlayer.room)?.players as GamePlayer[]).push(newPlayer);
            }
        }

        game.gameMode = 'classique';
        game.isModeSolo = room.mode === GameMode.Solo;

        room.players.forEach((player: RoomPlayer, i) => {
            if (player.isCreator) {
                (players[i] as RealPlayer).setGame(game, true);
            } else (players[i] as RealPlayer).setGame(game, false);
        });

        room.players.forEach((player: RoomPlayer, i) => {
            if (player.type === PlayerType.Bot) {
                (players[i] as Bot).setGame(game);
                (players[i] as Bot).start();
            }
        });
    }

    private async gameSubscriptions(room: GameRoom, game: Game) {
        game.turn.endTurn.subscribe(async () => {
            this.endGameScore(room.id);
            this.changeTurn(room.id);
            if (!game.turn.activePlayer) {
                await this.broadcastHighScores(room.players, room.id);
            }
        });

        game.turn.countdown.subscribe((timer: number) => {
            this.sendTimer(room.id, timer);
        });
    }

    private endGameScore(roomID: string) {
        const players = this.gamesHandler.gamePlayers.get(roomID)?.players as GamePlayer[];
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

    private createNewGame(room: GameRoom): Game | undefined {
        const dictionaryContainer: DictionaryContainer | undefined = this.gamesHandler.dictionaries.get(room.dictionary);
        if (!dictionaryContainer) return;

        return new Game(
            new Turn(room.timer),
            new LetterReserve(),
            this.gamesHandler.gamePlayers.get(room.id)?.players as GamePlayer[],
            dictionaryContainer.dictionaryValidation,
            dictionaryContainer.letterPlacement,
            dictionaryContainer.wordSolver,
        );
    }

    private changeTurn(roomId: string) {
        const players = this.gamesHandler.gamePlayers.get(roomId)?.players as GamePlayer[];
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

        const player = this.gamesHandler.players.get(socket.id) as GamePlayer;
        const room = player.room;
        this.gamesHandler.players.delete(socket.id);
        socket.leave(room);
        if (!player.game.isModeSolo) {
            this.socketManager.emitRoom(room, SocketEvents.UserDisconnect);
            this.switchToSolo(player).then();
            return;
        }
        player.game.abandon();
        this.gameEnded.next(player.room);
        this.gamesHandler.gamePlayers.delete(player.room);
    }

    private async switchToSolo(playerToReplace: GamePlayer) {
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
        else {
            this.findAndDeleteElementFromArray(playerToReplace.game.turn.inactivePlayers as string[], playerToReplace.name);
            playerToReplace.game.turn.inactivePlayers?.push(botPlayer.name);
        }

        const newRoom = this.gamesHandler.gamePlayers.get(playerToReplace.room)?.room;
        if (!newRoom) return;

        if (playerInRoom[1] === playerToReplace)
            this.gamesHandler.gamePlayers.set(playerToReplace.room, {
                room: newRoom,
                players: [playerInRoom[0], botPlayer],
            });
        else
            this.gamesHandler.gamePlayers.set(playerToReplace.room, {
                room: newRoom,
                players: [botPlayer, playerInRoom[1]],
            });

        this.updateNewBot(playerToReplace.game, playerToReplace.room, botPlayer);
    }

    private async generateBotName(oldName: string): Promise<string> {
        const playerBotList = await this.virtualPlayerStorage.getBeginnerBot();
        let botName = oldName;
        while (oldName.toString().toLowerCase() === botName.toString().toLowerCase()) {
            botName = playerBotList[Math.floor(Math.random() * playerBotList.length)].username;
        }
        return botName;
    }

    private updateNewBot(game: Game, roomId: string, botPlayer: GamePlayer) {
        game.isModeSolo = true;
        (botPlayer as BeginnerBot).setGame(game);
        (botPlayer as BeginnerBot).start();
        this.gamesHandler.updatePlayerInfo(roomId, game);
    }

    private disconnect(socket: Socket) {
        if (!this.gamesHandler.players.has(socket.id)) return;
        const player = this.gamesHandler.players.get(socket.id) as GamePlayer;
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
        const player = this.gamesHandler.players.get(socketId) as GamePlayer;
        if (this.gamesHandler.gamePlayers.get(player.room)?.players !== undefined && !player.game.isGameFinish) {
            this.gameEnded.next(player.room);
            player.game.isGameFinish = true;
            this.socketManager.emitRoom(player.room, SocketEvents.GameEnd);
            this.gamesHandler.gamePlayers.delete(player.room);
        }
    }

    private async broadcastHighScores(players: RoomPlayer[], roomId: string): Promise<void> {
        const playersInRoom = players.filter((player: RoomPlayer) => {
            const playerRoom = this.gamesHandler.players.get(player.socketId)?.room;
            if (playerRoom === roomId) return player.socketId;
            return;
        });
        if (playersInRoom.length !== 0) this.endGame(playersInRoom[0].socketId);

        for (const player of playersInRoom) {
            await this.sendHighScore(player);
        }
    }

    private async sendHighScore(player: RoomPlayer) {
        const gamePlayer = this.gamesHandler.players.get(player.socketId) as GamePlayer;

        await this.scoreStorage.addTopScores({
            username: player.user.username,
            type: gamePlayer.game.gameMode,
            score: gamePlayer.score,
        });
    }

    private sendPublicViewUpdate(server: Server, game: Game, roomId: string) {
        server.to(roomId).emit(SocketEvents.PublicViewUpdate, {
            gameboard: game.gameboard.gameboardTiles,
            activePlayer: game.turn.activePlayer,
        } as PublicViewUpdate);
    }

    private findAndDeleteElementFromArray(array: any[], element: any) {
        const NOT_FOUND = -1;
        const index = array?.indexOf(element);
        if (index !== NOT_FOUND) {
            array.splice(index as number, 1);
        }
    }
}
