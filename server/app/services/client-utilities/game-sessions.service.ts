import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { GameCreationQuery } from '@common/interfaces/game-creation-query';
import { GameRoom } from '@common/interfaces/game-room';
import { UserRoomQuery } from '@common/interfaces/user-room-query';
import { IUser } from '@common/interfaces/user';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';
import { SocketType } from '@app/types/sockets';
import {
    JOINING_ROOM_ID,
    ROOM_NOT_AVAILABLE_ERROR,
    ROOMID_LENGTH,
    SAME_USER_IN_ROOM_ERROR,
    UNAVAILABLE_ELEMENT_INDEX,
    WRONG_ROOM_PASSWORD,
} from '@app/constants/rooms';
import { GameRoomState } from '@common/models/game-room-state';
import { RoomPlayer } from '@common/interfaces/room-player';
import { PlayerType } from '@common/models/player-type';
import { GameVisibility } from '@common/models/game-visibility';

// const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";

@Service()
export class GameSessions {
    private gameRooms: GameRoom[];

    constructor(private socketManager: SocketManager) {
        this.gameRooms = [];
    }

    initSocketEvents() {
        this.socketManager.io(SocketEvents.CreateGame, (server: Server, socket: SocketType, gameQuery: GameCreationQuery) => {
            this.createGame(server, socket, gameQuery);
        });

        this.socketManager.io(SocketEvents.JoinGameRoom, (server: Server, socket: SocketType, userRoomQuery: UserRoomQuery) => {
            this.joinGameRoom(server, socket, userRoomQuery);
        });

        this.socketManager.io(SocketEvents.EnterRoomLobby, (server: Server, socket: SocketType) => {
            this.enterRoomLobby(server, socket);
        });

        this.socketManager.io(SocketEvents.ExitWaitingRoom, (server: Server, socket: SocketType, userQuery: UserRoomQuery) => {
            this.exitWaitingRoom(server, socket, userQuery);
        });

        this.socketManager.on(SocketEvents.RejectOpponent, (socket: SocketType, player: RoomPlayer) => {
            this.rejectOpponent(socket, player);
        });

        this.socketManager.on(SocketEvents.ExitGameRoom, (socket: SocketType, userRoomQuery: UserRoomQuery) => {
            this.exitGameRoom(socket, userRoomQuery);
        });

        this.socketManager.on(SocketEvents.Invite, (socket: Socket, inviteeId: string, userRoomQuery: UserRoomQuery) => {
            this.invitePlayer(socket, inviteeId, userRoomQuery);
        });

        this.socketManager.io(SocketEvents.StartScrabbleGame, (server: Server, socket: SocketType, roomId: string) => {
            this.startScrabbleGame(server, roomId);
        });
    }

    /**
     * Method to get a copy of all available rooms. The users have their passwords striped
     *
     * @return The array of all available rooms
     */
    getClientSafeAvailableRooms(): GameRoom[] {
        const roomAvailableArray: GameRoom[] = [];

        this.gameRooms.forEach((gameRoom) => {
            if (gameRoom.visibility !== GameVisibility.Private) {
                roomAvailableArray.push(this.stripPlayersPassword(gameRoom));
            }
        });

        return roomAvailableArray;
    }

    // TODO : Check if we still need that
    private invitePlayer(socket: Socket, inviteeId: string, parameters: UserRoomQuery): void {
        socket.broadcast.to(inviteeId).emit(SocketEvents.Invite, parameters);
    }

    private rejectOpponent(socket: Socket, player: RoomPlayer): void {
        // Check that the player is removed from the game room player list
        socket.broadcast.to(player.roomId).emit(SocketEvents.KickedFromGameRoom, this.stripPlayerPassword(player));
    }

    private enterRoomLobby(server: Server, socket: Socket): void {
        socket.join(JOINING_ROOM_ID);
        server.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
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
        }

        // TODO : Add user as an observer if room full
        socket.leave(JOINING_ROOM_ID);
        socket.join(joinGameQuery.roomId);

        this.addUserToRoom(socket.id, joinGameQuery);

        socket.emit(SocketEvents.JoinedValidGame, this.stripPlayersPassword(room));
        socket.broadcast.to(joinGameQuery.roomId).emit(SocketEvents.FoundAnOpponent, {
            user: this.stripUserPassword(joinGameQuery.user),
            roomId: joinGameQuery.roomId,
            type: PlayerType.User,
            isCreator: false,
        });

        server.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
    }

    private exitWaitingRoom(server: Server, socket: Socket, userQuery: UserRoomQuery): void {
        if (!userQuery.roomId) return;

        this.exitGameRoom(socket, userQuery);
        socket.broadcast.to(userQuery.roomId).emit(SocketEvents.OpponentLeave, this.stripUserPassword(userQuery.user));

        if (this.getPlayerFromQuery(userQuery)?.isCreator) {
            this.getRoom(userQuery.roomId)?.players.forEach((opponent: RoomPlayer) => {
                socket.broadcast.to(userQuery.roomId).emit(SocketEvents.KickedFromGameRoom, this.stripPlayerPassword(opponent));
            });

            this.removeRoom(server, userQuery.roomId);
        }
    }

    private exitGameRoom(socket: Socket, userQuery: UserRoomQuery): void {
        const player: RoomPlayer | undefined = this.getPlayerFromQuery(userQuery);
        if (!player) return;

        this.removePlayerFromGameRoom(player);
        socket.leave(userQuery.roomId);
        socket.join(JOINING_ROOM_ID);

        socket.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
    }

    private startScrabbleGame(server: Server, roomId: string): void {
        if (this.getRoom(roomId)) {
            server.to(roomId).emit(SocketEvents.GameAboutToStart, this.getRoom(roomId)?.players);
        }
    }

    private createGame(server: Server, socket: Socket, gameQuery: GameCreationQuery): void {
        const room: GameRoom = this.setupNewGameRoom(gameQuery, socket.id);

        socket.leave(JOINING_ROOM_ID);
        socket.join(room.id);
        socket.emit(SocketEvents.GameCreatedConfirmation, room);
        server.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
    }

    private passwordValid(query: UserRoomQuery): boolean {
        return this.getRoom(query.roomId)?.password === query.password;
    }

    private setupNewGameRoom(parameters: GameCreationQuery, socketId: string): GameRoom {
        const roomId = this.generateRoomId();
        const newRoom: GameRoom = {
            id: roomId,
            players: [
                {
                    user: parameters.user,
                    socketId,
                    roomId,
                    type: PlayerType.User,
                    isCreator: true,
                },
            ],
            dictionary: parameters.dictionary,
            timer: parameters.timer,
            mode: parameters.mode,
            // TODO : Change that
            state: GameRoomState.Waiting,
            visibility: parameters.visibility,
            password: parameters.password?.length ? parameters.password : '',
        };
        this.gameRooms.push(newRoom);

        return newRoom;
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

    private addUserToRoom(socketId: string, userQuery: UserRoomQuery): void {
        const room = this.getRoom(userQuery.roomId);
        if (!room) return;

        room.players.push({
            user: userQuery.user,
            socketId,
            roomId: room.id,
            type: PlayerType.User,
            isCreator: false,
        });
    }

    // TODO : Remove player from ITS room
    private removePlayerFromGameRoom(player: RoomPlayer): void {
        const room: GameRoom | undefined = this.getRoom(player.roomId);
        if (!room) return;

        const playerIndex: number = room.players.findIndex((playerElement: RoomPlayer) => this.areUsersTheSame(playerElement.user, player.user));
        if (playerIndex === UNAVAILABLE_ELEMENT_INDEX) return;

        room.players.splice(playerIndex, 1);
    }

    private areUsersTheSame(player1: IUser, player2: IUser): boolean {
        return (
            player1.username === player2.username && player1.email === player2.email && player1.profilePicture?.name === player2.profilePicture?.name
        );
    }

    private generateRoomId(): string {
        return uuid.v4().substring(0, ROOMID_LENGTH);
    }

    // !!! Saving that - could be useful
    // private getRoomId(socketId: string): string {
    //     let roomId = '';
    //
    //     this.gameRooms.forEach((room: GameRoom) => {
    //         room.players.forEach((player: RoomPlayer) => {
    //             if (player.socketId === socketId) {
    //                 roomId = player.roomId;
    //             }
    //         });
    //     });
    //
    //     return roomId;
    // }

    private getRoom(roomId: string): GameRoom | undefined {
        return this.gameRooms.find((room: GameRoom) => room.id === roomId);
    }

    private removeRoom(server: Server, roomId: string): void {
        this.gameRooms = this.gameRooms.filter((room: GameRoom) => room.id !== roomId);
        server.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
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
}
