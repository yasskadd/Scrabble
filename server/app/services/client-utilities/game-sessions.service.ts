import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { GameCreationQuery } from '@common/interfaces/game-creation-query';
import { GameRoom } from '@common/interfaces/game-room';
import { JoinGameQuery } from '@common/interfaces/join-game-query';
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
    SECOND,
    UNAVAILABLE_ELEMENT_INDEX,
    WRONG_ROOM_PASSWORD,
} from '@app/constants/rooms';
import { GameRoomState } from '@common/models/game-room-state';
import { RoomPlayer } from '@common/interfaces/room-player';
import { PlayerType } from '@common/models/player-type';

// const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";

@Service()
export class GameSessions {
    private gameRooms: GameRoom[];

    constructor(private socketManager: SocketManager) {
        this.gameRooms = [];
    }

    initSocketEvents() {
        this.socketManager.io(SocketEvents.CreateGame, (server: Server, socket: SocketType, gameInfo: GameCreationQuery) => {
            this.createGame(server, socket, gameInfo);
        });

        this.socketManager.io(SocketEvents.PlayerJoinGameAvailable, (server: Server, socket: SocketType, roomParameters: JoinGameQuery) => {
            this.joinGameRoom(server, socket, roomParameters);
        });

        this.socketManager.io(SocketEvents.RoomLobby, (server: Server, socket: SocketType) => {
            this.roomLobby(server, socket);
        });

        this.socketManager.on(SocketEvents.ExitWaitingRoom, (socket: SocketType, roomParameters: JoinGameQuery) => {
            this.exitWaitingRoom(socket, roomParameters);
        });

        this.socketManager.io(SocketEvents.RemoveRoom, (server: Server, socket: SocketType, roomID: string) => {
            this.removeRoom(server, roomID);
        });

        this.socketManager.on(SocketEvents.RejectOpponent, (socket: SocketType, roomParameters: JoinGameQuery) => {
            this.rejectOpponent(socket, roomParameters);
        });

        this.socketManager.on(SocketEvents.RejectByOtherPlayer, (socket: SocketType, roomParameters: JoinGameQuery) => {
            this.rejectByOtherPlayer(socket, roomParameters);
        });

        this.socketManager.on(SocketEvents.Invite, (socket: Socket, inviteeId: string, parameters: JoinGameQuery) => {
            this.invitePlayer(socket, inviteeId, parameters);
        });

        this.socketManager.io(SocketEvents.StartScrabbleGame, (server: Server, socket: SocketType, roomId: string) => {
            this.startScrabbleGame(server, roomId);
        });

        this.socketManager.io(SocketEvents.Disconnect, (server: Server, socket: SocketType) => {
            this.disconnect(server, socket);
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
            roomAvailableArray.push(this.stripPlayersPassword(gameRoom));

            roomAvailableArray.push(gameRoom);
        });

        return roomAvailableArray;
    }

    // TODO : Check if we still need that
    private invitePlayer(socket: Socket, inviteeId: string, parameters: JoinGameQuery): void {
        socket.broadcast.to(inviteeId).emit(SocketEvents.Invite, parameters);
    }

    private rejectOpponent(socket: Socket, roomParameters: JoinGameQuery): void {
        // Check that the player is removed from the game room player list
        socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.RejectByOtherPlayer, this.stripUserPassword(roomParameters.user));
    }

    private roomLobby(sio: Server, socket: Socket): void {
        socket.join(JOINING_ROOM_ID);
        sio.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
    }

    private disconnect(server: Server, socket: Socket): void {
        let tempTime = 5;
        setInterval(() => {
            tempTime = tempTime - 1;
            if (tempTime === 0) {
                const roomId = this.getRoomId(socket.id);
                if (roomId !== null) {
                    this.removeRoom(server, roomId);
                }
            }
        }, SECOND);
    }

    /**
     * Method to connect a player to a game room
     *
     * @param server: Server on which to send room events
     * @param socket: Socket on which the room resides
     * @param roomParameters
     * @private
     */
    private joinGameRoom(server: Server, socket: SocketType, roomParameters: JoinGameQuery): void {
        if (this.userAlreadyConnected(roomParameters)) {
            socket.emit(SocketEvents.ErrorJoining, SAME_USER_IN_ROOM_ERROR);
            return;
        }

        // TODO : Add user as an observer if room full
        if (this.verifyRoomPassword(roomParameters.password, roomParameters.roomId)) {
            // TODO : Check for password here

            socket.leave(JOINING_ROOM_ID);
            socket.join(roomParameters.roomId);

            this.addUserToRoom(socket.id, roomParameters);

            socket.emit(SocketEvents.JoinValidGame, this.getRoom(roomParameters.roomId)?.players);
            socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.FoundAnOpponent, {
                user: this.stripUserPassword(roomParameters.user),
                roomId: roomParameters.roomId,
                type: PlayerType.User,
                isCreator: false,
            });
        } else if (!this.verifyRoomPassword(roomParameters.password, roomParameters.roomId)) {
            socket.emit(SocketEvents.ErrorJoining, WRONG_ROOM_PASSWORD);
        } else {
            socket.emit(SocketEvents.ErrorJoining, ROOM_NOT_AVAILABLE_ERROR);
        }

        server.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
    }

    private exitWaitingRoom(socket: Socket, roomParameters: JoinGameQuery): void {
        if (!roomParameters.roomId) return;

        socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.OpponentLeave, this.stripUserPassword(roomParameters.user));
        socket.leave(roomParameters.roomId);
        socket.join(JOINING_ROOM_ID);
        this.removeUserFromRoom(socket.id, roomParameters);
    }

    private rejectByOtherPlayer(socket: Socket, roomParameters: JoinGameQuery): void {
        socket.leave(roomParameters.roomId);
        socket.join(JOINING_ROOM_ID);

        this.removeUserFromRoom(socket.id, roomParameters);
        socket.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
    }

    private startScrabbleGame(server: Server, roomId: string): void {
        if (this.getRoom(roomId)) {
            server.to(roomId).emit(SocketEvents.GameAboutToStart, this.getRoom(roomId)?.socketIds);
        }
    }

    private createGame(server: Server, socket: Socket, gameInfo: GameCreationQuery): void {
        const roomId = this.setupNewGameRoom(gameInfo, socket.id);

        socket.join(roomId);
        socket.emit(SocketEvents.GameCreatedConfirmation, roomId);
        server.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getClientSafeAvailableRooms());
    }

    private verifyRoomPassword(password: string | undefined, roomId: string): boolean {
        if (!this.getRoom(roomId)) return false;
        if (!password) return true;

        return this.getRoom(roomId)?.password === password;
    }

    private setupNewGameRoom(parameters: GameCreationQuery, socketId: string): string {
        const roomId = this.generateRoomId();
        const newRoom: GameRoom = {
            id: roomId,
            players: [
                {
                    user: parameters.user,
                    roomId,
                    type: PlayerType.User,
                    isCreator: true,
                },
            ],
            socketIds: [socketId],
            dictionary: parameters.dictionary,
            timer: parameters.timer,
            mode: parameters.mode,
            // TODO : Change that
            state: GameRoomState.Waiting,
            visibility: parameters.visibility,
            password: parameters.password?.length ? parameters.password : '',
        };
        this.gameRooms.push(newRoom);

        return newRoom.id;
    }

    private userAlreadyConnected(roomParameters: JoinGameQuery): boolean {
        let alreadyConnected = false;
        this.getRoom(roomParameters.roomId)?.players.forEach((connectedPlayer: RoomPlayer) => {
            if (this.areUsersTheSame(roomParameters.user, connectedPlayer.user)) {
                alreadyConnected = true;
            }
        });

        return alreadyConnected;
    }

    private addUserToRoom(socketId: string, roomParameters: JoinGameQuery): void {
        const room = this.getRoom(roomParameters.roomId);
        if (!room) return;

        room.players.push({
            user: roomParameters.user,
            roomId: room.id,
            type: PlayerType.User,
            isCreator: false,
        });
        room.socketIds.push(socketId);
    }

    private removeUserFromRoom(socketID: string, roomParameters: JoinGameQuery): void {
        const room: GameRoom | undefined = this.getRoom(roomParameters.roomId);
        if (!room) return;

        const userId: number = room.players.findIndex((player: RoomPlayer) => this.areUsersTheSame(player.user, roomParameters.user));
        if (userId === UNAVAILABLE_ELEMENT_INDEX) return;

        room.players.splice(userId, 1);
        room.socketIds.splice(room.socketIds.indexOf(socketID), 1);
    }

    private areUsersTheSame(player1: IUser, player2: IUser): boolean {
        return (
            player1.username === player2.username && player1.email === player2.email && player1.profilePicture?.name === player2.profilePicture?.name
        );
    }

    private generateRoomId(): string {
        return uuid.v4().substring(0, ROOMID_LENGTH);
    }

    private getRoomId(socketID: string): string {
        for (const room of this.gameRooms) {
            if (room.socketIds.includes(socketID)) {
                return room.id;
            }
        }

        return '';
    }

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
}
