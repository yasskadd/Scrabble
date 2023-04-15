/* eslint-disable max-lines */
import { ROOMID_LENGTH, UNAVAILABLE_ELEMENT_INDEX } from '@app/constants/rooms';
import { VirtualPlayersStorageService } from '@app/services/database/virtual-players-storage.service';
import { GamesHandlerService } from '@app/services/games-management/games-handler.service';
import { GamesStateService } from '@app/services/games-management/games-state.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketType } from '@app/types/sockets';
import { INVALID_INDEX } from '@common/constants/board-info';
import { NUMBER_OF_PLAYERS } from '@common/constants/players';
import { GAME_LOBBY_ROOM_ID } from '@common/constants/room';
import { ServerErrors } from '@common/constants/server-errors';
import { SocketEvents } from '@common/constants/socket-events';
import { GameCreationQuery } from '@common/interfaces/game-creation-query';
import { GameRoom } from '@common/interfaces/game-room';
import { RoomPlayer } from '@common/interfaces/room-player';
import { IUser } from '@common/interfaces/user';
import { UserRoomQuery } from '@common/interfaces/user-room-query';
import { GameDifficulty } from '@common/models/game-difficulty';
import { GameMode } from '@common/models/game-mode';
import { GameRoomState } from '@common/models/game-room-state';
import { GameVisibility } from '@common/models/game-visibility';
import { PlayerType } from '@common/models/player-type';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';
import { ChatHandlerService } from './chat-handler.service';

// const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";

@Service()
export class WaitingRoomService {
    private waitingRooms: GameRoom[];

    constructor(
        private gameStateService: GamesStateService,
        private virtualPlayerStorageService: VirtualPlayersStorageService,
        private socketManager: SocketManager,
        private chatHandler: ChatHandlerService,
        private gamesHandler: GamesHandlerService,
    ) {
        this.waitingRooms = [];
        this.gamesHandler.deleteWaitingRoom.subscribe((roomID: string) => {
            this.removeRoom(this.socketManager.server, roomID);
        });
    }

    initSocketEvents() {
        this.socketManager.io(SocketEvents.CreateWaitingRoom, async (server: Server, socket: SocketType, gameQuery: GameCreationQuery) => {
            await this.createWaitingRoom(server, socket, gameQuery);
        });

        this.socketManager.io(SocketEvents.JoinWaitingRoom, (server: Server, socket: SocketType, userRoomQuery: UserRoomQuery) => {
            this.joinGameRoom(server, socket, userRoomQuery);
        });

        this.socketManager.io(SocketEvents.EnterRoomLobby, (server: Server, socket: SocketType) => {
            this.enterRoomLobby(server, socket);
        });

        this.socketManager.io(SocketEvents.ExitWaitingRoom, (server: Server, socket: SocketType, userQuery: UserRoomQuery) => {
            this.exitWaitingRoom(server, socket, userQuery);
        });

        this.socketManager.io(SocketEvents.StartScrabbleGame, async (server: Server, socket: SocketType, roomId: string) => {
            await this.startScrabbleGame(server, roomId);
        });

        this.socketManager.on(SocketEvents.UpdateGameRooms, (socket: Socket) => {
            this.gamesHandler.cleanRooms();
            socket.emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
        });
    }

    removeRoom(server: Server, roomId: string): void {
        const roomIndex = this.waitingRooms.findIndex((room: GameRoom) => room.id === roomId);
        this.waitingRooms.splice(roomIndex, 1);
        this.chatHandler.deleteGameChatRoom(roomId);

        this.gamesHandler.cleanRooms().forEach((id: string) => {
            this.waitingRooms = this.waitingRooms.filter((wr: GameRoom) => wr.id === id);
        });

        server.emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
    }

    private enterRoomLobby(server: Server, socket: Socket): void {
        socket.join(GAME_LOBBY_ROOM_ID);
        server.to(GAME_LOBBY_ROOM_ID).emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
    }

    /**
     * Method to connect a player to a game room
     *
     * @param server: Server on which to send room events
     * @param socket: Socket on which the room resides
     * @param joinGameQuery
     * @private
     */
    private joinGameRoom(server: Server, socket: SocketType, joinGameQuery: UserRoomQuery): void {
        const room: GameRoom | undefined = this.getRoom(joinGameQuery.roomId);
        if (this.userAlreadyConnected(joinGameQuery)) {
            // console.log('ALREADY CONNECTED');
            socket.emit(SocketEvents.ErrorJoining, ServerErrors.RoomSameUser);
            return;
        }
        if (!room) {
            // console.log('room not found');
            socket.emit(SocketEvents.ErrorJoining, ServerErrors.RoomNotAvailable);
            return;
        }
        if (room.visibility === GameVisibility.Locked && !this.passwordValid(joinGameQuery)) {
            socket.emit(SocketEvents.ErrorJoining, ServerErrors.RoomWrongPassword);
            return;
        }

        // TODO : Add user as an observer if room full
        socket.leave(GAME_LOBBY_ROOM_ID);

        socket.join(room.id);
        this.chatHandler.joinGameChatRoom(socket, room.id);

        const newPlayer: RoomPlayer = {
            user: joinGameQuery.user,
            socketId: socket.id,
            roomId: room.id,
            type: PlayerType.User,
            isCreator: false,
        };
        if (
            room.players.filter((player: RoomPlayer) => player.type === PlayerType.User).length === NUMBER_OF_PLAYERS ||
            room.state === GameRoomState.Playing
        ) {
            newPlayer.type = PlayerType.Observer;
        } else {
            const botIndex = room.players.findIndex((player: RoomPlayer) => player.type === PlayerType.Bot);
            if (botIndex !== INVALID_INDEX) {
                room.players.splice(botIndex, 1);
            }
        }
        room.players.push(newPlayer);

        // server.to(joinGameQuery.roomId).emit(SocketEvents.PlayerJoinedWaitingRoom, this.stripPlayerPassword(newPlayer));
        server.to(room.id).emit(SocketEvents.UpdateWaitingRoom, room);
        socket.emit(SocketEvents.JoinedValidWaitingRoom, this.stripPlayersPassword(room));
        server.to(GAME_LOBBY_ROOM_ID).emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());

        if (room.state === GameRoomState.Playing) {
            this.gameStateService.addObserver(server, joinGameQuery.roomId, newPlayer);
        }
    }

    private exitWaitingRoom(server: Server, socket: SocketType, userQuery: UserRoomQuery): void {
        // TODO : Replace player with bot
        const room: GameRoom | undefined = this.getRoom(userQuery.roomId);
        if (!room) return;

        if (
            (room.state === GameRoomState.Waiting && this.getPlayerFromQuery(userQuery)?.isCreator) ||
            (room.state === GameRoomState.Playing && !this.gamesHandler.usersRemaining(room.id))
        ) {
            for (const p of room.players) {
                this.rejectOpponent(server, socket, p);
            }
            this.removeRoom(server, userQuery.roomId);

            return;
        }

        const player = this.getPlayerFromQuery(userQuery);
        // TODO : Tell client the rejection failed
        if (!player) return;

        this.rejectOpponent(server, socket, player);
    }

    private rejectOpponent(server: Server, socket: Socket, player: RoomPlayer): void {
        const playerSocket: Socket | undefined = this.socketManager.getSocketFromId(player.socketId);
        if (!playerSocket) return;

        this.exitRoom(server, playerSocket, {
            user: player.user,
            roomId: player.roomId,
        });

        // TODO : Not if in game
        if (
            !player.isCreator &&
            player.socketId !== socket.id &&
            this.waitingRooms.find((room: GameRoom) => room.id === player.roomId)?.state === GameRoomState.Waiting
        ) {
            playerSocket.emit(SocketEvents.KickedFromGameRoom, this.stripPlayerPassword(player));
        }

        server.to(player.roomId).emit(SocketEvents.UpdateWaitingRoom, this.getRoom(player.roomId));
    }

    private async exitRoom(server: Server, socket: SocketType, userQuery: UserRoomQuery): Promise<void> {
        const player: RoomPlayer | undefined = this.getPlayerFromQuery(userQuery);
        if (!player) return;

        this.removePlayerFromGameRoom(socket, player);
        if (this.getRoom(userQuery.roomId) !== undefined && this.getRoom(userQuery.roomId)?.state !== GameRoomState.Playing) {
            const waitingRoom = this.getRoom(userQuery.roomId) as GameRoom;
            const bot = await this.createReplacementBot(waitingRoom?.difficulty as GameDifficulty, userQuery.roomId);
            waitingRoom?.players.push(bot as unknown as RoomPlayer);
            server.to(waitingRoom.id).emit(SocketEvents.UpdateWaitingRoom, waitingRoom);
        }

        this.gamesHandler.cleanRooms();
        server.to(GAME_LOBBY_ROOM_ID).emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
    }

    private async startScrabbleGame(server: Server, roomId: string): Promise<void> {
        const room: GameRoom | undefined = this.getRoom(roomId);
        if (!room) return;

        room.state = GameRoomState.Playing;
        await this.gameStateService.createGame(server, room);
        // // TODO : Changed GameScrabbleInformation to simply using GameRoom
        // const users: IUser[] = [];
        // const socketIds: string[] = [];
        // room.players.forEach((player: RoomPlayer) => {
        //     users.push(player.user);
        //     socketIds.push(player.socketId);
        // });
        //
        // this.gameStateService
        //     .createGame(server, {
        //         players: users,
        //         roomId,
        //         timer: room.timer,
        //         socketId: socketIds,
        //         mode: room.mode,
        //         botDifficulty: 'easy',
        //         dictionary: room.dictionary,
        //     } as GameScrabbleInformation)
        //     .then(() => {
        //         server.to(roomId).emit(SocketEvents.GameAboutToStart);
        //     });
    }

    private async createWaitingRoom(server: Server, socket: SocketType, gameQuery: GameCreationQuery): Promise<void> {
        this.waitingRooms = this.waitingRooms.filter((r: GameRoom) => {
            return this.gamesHandler.usersRemaining(r.id);
        });

        const room: GameRoom = await this.setupNewGameRoom(gameQuery, socket.id);
        this.waitingRooms.push(room);

        server.to(GAME_LOBBY_ROOM_ID).emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
        socket.leave(GAME_LOBBY_ROOM_ID);

        socket.join(room.id);
        this.chatHandler.createGameChatRoom(socket, room.id);
        socket.emit(SocketEvents.UpdateWaitingRoom, room);
    }

    private passwordValid(query: UserRoomQuery): boolean {
        return this.getRoom(query.roomId)?.password === query.password;
    }

    private async setupNewGameRoom(parameters: GameCreationQuery, socketId: string): Promise<GameRoom> {
        const roomId = this.generateRoomId();
        const bots = await this.makeBots(parameters.botDifficulty, roomId, 3);

        return {
            id: roomId,
            players: [
                {
                    user: parameters.user,
                    socketId,
                    roomId,
                    type: PlayerType.User,
                    isCreator: true,
                },
                bots[0],
                bots[1],
                bots[2],
            ],
            dictionary: parameters.dictionary,
            timer: parameters.timer,
            mode: parameters.mode,
            state: parameters.mode === GameMode.Solo ? GameRoomState.Playing : GameRoomState.Waiting,
            visibility: parameters.visibility,
            password: parameters.password,
            difficulty: parameters.botDifficulty,
        };
    }

    private userAlreadyConnected(roomParameters: UserRoomQuery): boolean {
        let alreadyConnected = false;
        this.getRoom(roomParameters.roomId)?.players.forEach((connectedPlayer: RoomPlayer) => {
            if (this.areUsersTheSame(roomParameters.user, connectedPlayer.user)) {
                alreadyConnected = true;
            }
        });

        return alreadyConnected;
    }

    // TODO: Replace removed player by a bot ???
    private removePlayerFromGameRoom(socket: Socket, player: RoomPlayer): void {
        const room: GameRoom | undefined = this.getRoom(player.roomId);
        if (!room) return;

        const playerIndex: number = room.players.findIndex((playerElement: RoomPlayer) => this.areUsersTheSame(playerElement.user, player.user));
        if (playerIndex === UNAVAILABLE_ELEMENT_INDEX) return;
        room.players.splice(playerIndex, 1); // remove player from room;

        this.chatHandler.leaveGameChatRoom(socket, room.id);
        socket.leave(player.roomId);
        socket.join(GAME_LOBBY_ROOM_ID);
    }

    private areUsersTheSame(player1: IUser, player2: IUser): boolean {
        return player1._id === player2._id;
    }

    private generateRoomId(): string {
        return uuid.v4().substring(0, ROOMID_LENGTH);
    }

    private getRoom(roomId: string): GameRoom | undefined {
        return this.waitingRooms.find((room: GameRoom) => room.id === roomId);
    }

    /**
     * Method to get a copy of all available rooms. The users have their passwords striped
     *
     * @return The array of all available rooms
     */
    private getClientSafeAvailableRooms(): GameRoom[] {
        const roomAvailableArray: GameRoom[] = [];

        this.waitingRooms.forEach((gameRoom) => {
            if (gameRoom.visibility !== GameVisibility.Private && gameRoom.mode === GameMode.Multi) {
                roomAvailableArray.push(this.stripPlayersPassword(gameRoom));
            }
        });

        return roomAvailableArray;
    }

    private stripUserPassword(user: IUser): IUser {
        return {
            _id: user._id,
            email: user.email,
            username: user.username,
            password: 'null',
            profilePicture: user.profilePicture,
            chatRooms: user.chatRooms,
            historyEventList: user.historyEventList,
            theme: user.theme,
            language: user.language,
        } as IUser;
    }

    private stripPlayerPassword(player: RoomPlayer): RoomPlayer {
        return {
            user: this.stripUserPassword(player.user),
            roomId: player.roomId,
            socketId: player.socketId,
            type: player.type,
            isCreator: player.isCreator,
        };
    }

    private stripPlayersPassword(gameRoom: GameRoom): GameRoom {
        const usersWithoutPasswords: RoomPlayer[] = [];

        gameRoom.players.forEach((player: RoomPlayer) => {
            usersWithoutPasswords.push(this.stripPlayerPassword(player));
        });
        gameRoom.players = usersWithoutPasswords;

        return gameRoom;
    }

    private getPlayerFromQuery(userQuery: UserRoomQuery): RoomPlayer | undefined {
        return this.getRoom(userQuery.roomId)?.players.find((playerElement: RoomPlayer) => this.areUsersTheSame(playerElement.user, userQuery.user));
    }

    private async makeBots(difficulty: GameDifficulty, roomId: string, numberOfBots: number): Promise<RoomPlayer[]> {
        const virtualPlayers: RoomPlayer[] = [];

        const botNames: string[] = await this.virtualPlayerStorageService.getBotName(numberOfBots, difficulty);
        botNames.forEach((name: string) => {
            virtualPlayers.push({
                user: {
                    _id: uuid.v4(),
                    username: name,
                    password: 'null',
                    profilePicture: {
                        name: 'bot-image',
                        isDefaultPicture: true,
                        key: 'f553ba598dbcfc7e9e07f8366b6684b5.jpg',
                    },
                    chatRooms: [],
                },
                socketId: '',
                roomId,
                type: PlayerType.Bot,
                isCreator: false,
            });
        });

        return virtualPlayers;
    }

    private async createReplacementBot(difficulty: GameDifficulty, roomId: string): Promise<RoomPlayer> {
        const botNames = await this.virtualPlayerStorageService.getBotName(3, difficulty);
        const waitingRoom = this.getRoom(roomId);
        const currentRoomBotNames: string[] | undefined = waitingRoom?.players
            .filter((player) => player.type === PlayerType.Bot)
            .map((player) => player.user.username);
        const validBotName = botNames.find((name: string) => !currentRoomBotNames?.includes(name));
        return {
            user: {
                _id: uuid.v4(),
                username: validBotName as string,
                password: 'null',
                profilePicture: {
                    name: 'bot-image',
                    isDefaultPicture: true,
                    key: 'f553ba598dbcfc7e9e07f8366b6684b5.jpg',
                },
            },
            socketId: '',
            roomId,
            type: PlayerType.Bot,
            isCreator: false,
        } as RoomPlayer;
    }
}
