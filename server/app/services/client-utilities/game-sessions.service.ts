/* eslint-disable max-lines */
import {
    ROOMID_LENGTH,
    ROOM_NOT_AVAILABLE_ERROR,
    SAME_USER_IN_ROOM_ERROR,
    UNAVAILABLE_ELEMENT_INDEX,
    WRONG_ROOM_PASSWORD,
} from '@app/constants/rooms';
import { VirtualPlayersStorageService } from '@app/services/database/virtual-players-storage.service';
import { GamesStateService } from '@app/services/games-management/games-state.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketType } from '@app/types/sockets';
import { INVALID_INDEX } from '@common/constants/board-info';
import { NUMBER_OF_PLAYERS } from '@common/constants/players';
import { GAME_LOBBY_ROOM_ID } from '@common/constants/room';
import { SocketEvents } from '@common/constants/socket-events';
import { GameCreationQuery } from '@common/interfaces/game-creation-query';
import { GameRoom } from '@common/interfaces/game-room';
import { RoomPlayer } from '@common/interfaces/room-player';
import { IUser } from '@common/interfaces/user';
import { UserRoomQuery } from '@common/interfaces/user-room-query';
import { GameDifficulty } from '@common/models/game-difficulty';
import { GameRoomState } from '@common/models/game-room-state';
import { GameVisibility } from '@common/models/game-visibility';
import { PlayerType } from '@common/models/player-type';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';

// const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";

@Service()
export class GameSessions {
    private gameRooms: GameRoom[];

    constructor(
        private gameStateService: GamesStateService,
        private virtualPlayerStorageService: VirtualPlayersStorageService,
        private socketManager: SocketManager,
    ) {
        this.gameRooms = [];
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
            socket.emit(SocketEvents.ErrorJoining, SAME_USER_IN_ROOM_ERROR);
            return;
        }
        if (!room) {
            socket.emit(SocketEvents.ErrorJoining, ROOM_NOT_AVAILABLE_ERROR);
            return;
        }
        if (room.visibility === GameVisibility.Locked && !this.passwordValid(joinGameQuery)) {
            socket.emit(SocketEvents.ErrorJoining, WRONG_ROOM_PASSWORD);
            return;
        }

        // TODO : Add user as an observer if room full
        socket.leave(GAME_LOBBY_ROOM_ID);
        socket.join(joinGameQuery.roomId);

        const newPlayer: RoomPlayer = {
            user: joinGameQuery.user,
            socketId: socket.id,
            roomId: room.id,
            type: PlayerType.User,
            isCreator: false,
        };
        if (room.players.filter((player: RoomPlayer) => player.type === PlayerType.User).length === NUMBER_OF_PLAYERS) {
            newPlayer.type = PlayerType.Observer;
        }
        const botIndex = room.players.findIndex((player: RoomPlayer) => player.type === PlayerType.Bot);
        if (botIndex !== INVALID_INDEX) {
            room.players.splice(botIndex, 1);
        }
        room.players.push(newPlayer);

        // server.to(joinGameQuery.roomId).emit(SocketEvents.PlayerJoinedWaitingRoom, this.stripPlayerPassword(newPlayer));
        server.to(joinGameQuery.roomId).emit(SocketEvents.UpdateWaitingRoom, room);
        socket.emit(SocketEvents.JoinedValidWaitingRoom, this.stripPlayersPassword(room));

        server.to(GAME_LOBBY_ROOM_ID).emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
    }

    private exitWaitingRoom(server: Server, socket: SocketType, userQuery: UserRoomQuery): void {
        // TODO : Replace player with observer if present
        // TODO : Replace player with bot if no observers
        const room: GameRoom | undefined = this.getRoom(userQuery.roomId);
        if (!room) return;

        if (!this.getPlayerFromQuery(userQuery)?.isCreator) {
            const player = this.getPlayerFromQuery(userQuery);
            // TODO : Tell client the rejection failed
            if (!player) return;

            this.rejectOpponent(server, socket, player);

            return;
        }

        for (const player of [...room.players]) {
            this.rejectOpponent(server, socket, player);
        }

        this.removeRoom(server, userQuery.roomId);
    }

    private rejectOpponent(server: Server, socket: Socket, player: RoomPlayer): void {
        const playerSocket: Socket | undefined = this.socketManager.getSocketFromId(player.socketId);
        if (!playerSocket) return;

        this.exitGameRoom(server, playerSocket, {
            user: player.user,
            roomId: player.roomId,
        });

        if (!player.isCreator && player.socketId !== socket.id) {
            playerSocket.emit(SocketEvents.KickedFromGameRoom, this.stripPlayerPassword(player));
        }

        server.to(player.roomId).emit(SocketEvents.UpdateWaitingRoom, this.getRoom(player.roomId));
    }

    private exitGameRoom(server: Server, socket: SocketType, userQuery: UserRoomQuery): void {
        const player: RoomPlayer | undefined = this.getPlayerFromQuery(userQuery);
        if (!player) return;

        this.removePlayerFromGameRoom(socket, player);

        server.to(GAME_LOBBY_ROOM_ID).emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
    }

    private async startScrabbleGame(server: Server, roomId: string): Promise<void> {
        const room = this.getRoom(roomId);

        if (room) {
            await this.gameStateService.createGame(server, room);
            server.to(roomId).emit(SocketEvents.GameAboutToStart);
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
    }

    private async createWaitingRoom(server: Server, socket: SocketType, gameQuery: GameCreationQuery): Promise<void> {
        const room: GameRoom = await this.setupNewGameRoom(gameQuery, socket.id);
        this.gameRooms.push(room);

        server.to(GAME_LOBBY_ROOM_ID).emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
        socket.leave(GAME_LOBBY_ROOM_ID);

        socket.join(room.id);
        socket.emit(SocketEvents.UpdateWaitingRoom, room);
    }

    private passwordValid(query: UserRoomQuery): boolean {
        return this.getRoom(query.roomId)?.password === query.password;
    }

    private async setupNewGameRoom(parameters: GameCreationQuery, socketId: string): Promise<GameRoom> {
        const roomId = this.generateRoomId();
        const bots = await this.makeThreeBots(parameters.botDifficulty);

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
            // TODO : Change that
            state: GameRoomState.Waiting,
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

    private removePlayerFromGameRoom(socket: Socket, player: RoomPlayer): void {
        const room: GameRoom | undefined = this.getRoom(player.roomId);
        if (!room) return;

        const playerIndex: number = room.players.findIndex((playerElement: RoomPlayer) => this.areUsersTheSame(playerElement.user, player.user));
        if (playerIndex === UNAVAILABLE_ELEMENT_INDEX) return;
        room.players.splice(playerIndex, 1);

        socket.leave(player.roomId);
        socket.join(GAME_LOBBY_ROOM_ID);
    }

    private areUsersTheSame(player1: IUser, player2: IUser): boolean {
        return (
            player1.username === player2.username && player1.email === player2.email && player1.profilePicture?.name === player2.profilePicture?.name
        );
    }

    private generateRoomId(): string {
        return uuid.v4().substring(0, ROOMID_LENGTH);
    }

    private getRoom(roomId: string): GameRoom | undefined {
        return this.gameRooms.find((room: GameRoom) => room.id === roomId);
    }

    private removeRoom(server: Server, roomId: string): void {
        this.gameRooms = this.gameRooms.filter((room: GameRoom) => room.id !== roomId);
        server.to(GAME_LOBBY_ROOM_ID).emit(SocketEvents.UpdateGameRooms, this.getClientSafeAvailableRooms());
    }

    /**
     * Method to get a copy of all available rooms. The users have their passwords striped
     *
     * @return The array of all available rooms
     */
    private getClientSafeAvailableRooms(): GameRoom[] {
        const roomAvailableArray: GameRoom[] = [];

        this.gameRooms.forEach((gameRoom) => {
            if (gameRoom.visibility !== GameVisibility.Private) {
                roomAvailableArray.push(this.stripPlayersPassword(gameRoom));
            }
        });

        return roomAvailableArray;
    }

    private stripUserPassword(user: IUser): IUser {
        return {
            email: user.email,
            username: user.username,
            password: 'null',
            profilePicture: user.profilePicture,
        } as IUser;
    }

    private stripPlayerPassword(player: RoomPlayer): RoomPlayer {
        return {
            user: this.stripUserPassword(player.user),
            roomId: player.roomId,
            socketId: player.socketId,
            type: player.type,
            isCreator: player.isCreator,
        } as RoomPlayer;
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

    private async makeThreeBots(difficulty: GameDifficulty): Promise<RoomPlayer[]> {
        const virtualPlayers: RoomPlayer[] = [];

        // TODO : Add image getter - we should create a profile pic service from the methods in the controller
        // const getImageCommand = this.CreateGetCommand(image[1]);
        // const signedUrl = await getSignedUrl(this.s3Client, getImageCommand, { expiresIn: 3600 });

        const botNames: string[] = await this.virtualPlayerStorageService.getBotName(3, difficulty);
        botNames.forEach((name: string) => {
            virtualPlayers.push({
                user: {
                    username: name,
                    password: 'null',
                    profilePicture: {
                        name: 'bot-image',
                        isDefaultPicture: true,
                    },
                },
                socketId: '',
                roomId: '',
                type: PlayerType.Bot,
                isCreator: false,
            });
        });

        return virtualPlayers;
    }
}
