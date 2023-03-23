import { SocketManager } from '@app/services/socket/socket-manager.service';
import { NUMBER_OF_PLAYERS } from '@common/constants/players';
import { SocketEvents } from '@common/constants/socket-events';
import { GameParameters } from '@common/interfaces/game-parameters';
import { GameRoom } from '@common/interfaces/game-room';
import { JoinGameRoomParameters } from '@common/interfaces/join-game-room-parameters';
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

// const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";

@Service()
export class GameSessions {
    private gameRooms: GameRoom[];

    constructor(private socketManager: SocketManager) {
        this.gameRooms = [];
    }

    initSocketEvents() {
        this.socketManager.io(SocketEvents.CreateGame, (sio, socket: SocketType, gameInfo: GameParameters) => {
            this.createGame(sio, socket, gameInfo);
        });

        this.socketManager.io(SocketEvents.PlayerJoinGameAvailable, (server: Server, socket: SocketType, roomParameters: JoinGameRoomParameters) => {
            this.joinGameRoom(server, socket, roomParameters);
        });

        this.socketManager.io(SocketEvents.RoomLobby, (sio, socket: SocketType) => {
            this.roomLobby(sio, socket);
        });

        this.socketManager.on(SocketEvents.ExitWaitingRoom, (socket: SocketType, roomParameters: JoinGameRoomParameters) => {
            this.exitWaitingRoom(socket, roomParameters);
        });

        this.socketManager.io(SocketEvents.RemoveRoom, (server: Server, socket: SocketType, roomID: string) => {
            this.removeRoom(server, roomID);
        });

        this.socketManager.on(SocketEvents.RejectOpponent, (socket: SocketType, roomParameters: JoinGameRoomParameters) => {
            this.rejectOpponent(socket, roomParameters);
        });

        this.socketManager.on(SocketEvents.RejectByOtherPlayer, (socket: SocketType, roomParameters: JoinGameRoomParameters) => {
            this.rejectByOtherPlayer(socket, roomParameters);
        });

        this.socketManager.on(SocketEvents.Invite, (socket, inviteeId: string, parameters: JoinGameRoomParameters) => {
            this.invitePlayer(socket, inviteeId, parameters);
        });

        this.socketManager.io(SocketEvents.StartScrabbleGame, (sio, socket: SocketType, roomId: string) => {
            this.startScrabbleGame(sio, roomId);
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
    getAvailableRooms(): GameRoom[] {
        const roomAvailableArray: GameRoom[] = [];

        this.gameRooms.forEach((gameRoom) => {
            if (gameRoom.isAvailable) {
                const usersWithoutPasswords: IUser[] = [];
                gameRoom.users.forEach((user: IUser) => {
                    usersWithoutPasswords.push(this.stripUserPassword(user));
                });
                gameRoom.users = usersWithoutPasswords;

                roomAvailableArray.push(gameRoom);
            }
        });

        return roomAvailableArray;
    }

    // TODO : Check if we still need that
    private invitePlayer(socket: Socket, inviteeId: string, parameters: JoinGameRoomParameters): void {
        socket.broadcast.to(inviteeId).emit(SocketEvents.Invite, parameters);
    }

    private rejectOpponent(socket: Socket, roomParameters: JoinGameRoomParameters): void {
        // Check that the player is removed from the game room player list
        socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.RejectByOtherPlayer, this.stripUserPassword(roomParameters.player));
    }

    private roomLobby(sio: Server, socket: Socket): void {
        socket.join(JOINING_ROOM_ID);
        sio.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
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
    private joinGameRoom(server: Server, socket: SocketType, roomParameters: JoinGameRoomParameters): void {
        if (this.userAlreadyConnected(roomParameters)) {
            socket.emit(SocketEvents.ErrorJoining, SAME_USER_IN_ROOM_ERROR);
            return;
        }

        if (this.isRoomAvailable(roomParameters.roomId) && this.verifyRoomPassword(roomParameters.password, roomParameters.roomId)) {
            // TODO : Check for password here

            socket.leave(JOINING_ROOM_ID);
            socket.join(roomParameters.roomId);

            this.addUserToRoom(socket.id, roomParameters);

            socket.emit(SocketEvents.JoinValidGame, this.getPlayers(roomParameters.roomId));
            socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.FoundAnOpponent, this.stripUserPassword(roomParameters.player));
        } else if (!this.verifyRoomPassword(roomParameters.password, roomParameters.roomId)) {
            socket.emit(SocketEvents.ErrorJoining, WRONG_ROOM_PASSWORD);
        } else {
            socket.emit(SocketEvents.ErrorJoining, ROOM_NOT_AVAILABLE_ERROR);
        }

        server.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private exitWaitingRoom(socket: Socket, roomParameters: JoinGameRoomParameters): void {
        if (!roomParameters.roomId) return;

        socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.OpponentLeave, this.stripUserPassword(roomParameters.player));
        socket.leave(roomParameters.roomId);
        socket.join(JOINING_ROOM_ID);
        this.removeUserFromRoom(socket.id, roomParameters);
    }

    private rejectByOtherPlayer(socket: Socket, roomParameters: JoinGameRoomParameters): void {
        socket.leave(roomParameters.roomId);
        socket.join(JOINING_ROOM_ID);

        this.removeUserFromRoom(socket.id, roomParameters);
        socket.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private startScrabbleGame(server: Server, roomId: string): void {
        if (this.getRoom(roomId)) {
            server.to(roomId).emit(SocketEvents.GameAboutToStart, this.getRoom(roomId)?.socketId);
        }
    }

    private createGame(sio: Server, socket: Socket, gameInfo: GameParameters): void {
        const roomId = this.setupNewRoom(gameInfo, socket.id);
        socket.join(roomId);
        socket.emit(SocketEvents.GameCreatedConfirmation, roomId);
        sio.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private getNewId(): string {
        return uuid.v4().substring(0, ROOMID_LENGTH);
    }

    private verifyRoomPassword(password: string | undefined, roomId: string): boolean {
        if (!this.getRoom(roomId)) return false;
        if (!password) return true;

        return this.getRoom(roomId)?.password === password;
    }

    private setupNewRoom(parameters: GameParameters, socketId: string): string {
        const roomID = this.getNewId();
        const newRoom: GameRoom = {
            id: roomID,
            users: [parameters.user],
            socketId: [socketId],
            isAvailable: parameters.isMultiplayer,
            dictionary: parameters.dictionary,
            timer: parameters.timer,
            mode: parameters.mode,
            visibility: parameters.visibility,
            password: parameters.password?.length ? parameters.password : '',
        };
        this.gameRooms.push(newRoom);

        return roomID;
    }

    private userAlreadyConnected(roomParameters: JoinGameRoomParameters): boolean {
        let alreadyConnected = false;
        this.getRoom(roomParameters.roomId)?.users.forEach((connectedUser: IUser) => {
            if (this.areUsersTheSame(roomParameters.player, connectedUser)) {
                alreadyConnected = true;
            }
        });

        return alreadyConnected;
    }

    private getPlayers(roomID: string): IUser[] {
        const players: IUser[] = [];

        this.getRoom(roomID)?.users.forEach((user: IUser) => {
            players.push(this.stripUserPassword(user));
        });

        return players;
    }

    private updateRoomAvailability(roomID: string): void {
        // TODO : Change that so it works with observers
        const room = this.getRoom(roomID);

        if (room) {
            room.isAvailable = room.socketId.length < NUMBER_OF_PLAYERS;
        }
    }

    private addUserToRoom(socketID: string, roomParameters: JoinGameRoomParameters): void {
        const room = this.getRoom(roomParameters.roomId);
        if (!room) return;

        room.users.push(roomParameters.player);
        room.socketId.push(socketID);
        this.updateRoomAvailability(roomParameters.roomId);
    }

    private removeUserFromRoom(socketID: string, roomParameters: JoinGameRoomParameters): void {
        const room: GameRoom | undefined = this.getRoom(roomParameters.roomId);
        if (!room) return;

        const userId: number = room.users.findIndex((user: IUser) => this.areUsersTheSame(user, roomParameters.player));
        if (userId === UNAVAILABLE_ELEMENT_INDEX) return;

        room.users.splice(userId, 1);
        room.socketId.splice(room.socketId.indexOf(socketID), 1);

        this.updateRoomAvailability(roomParameters.roomId);
    }

    private removeRoom(server: Server, roomId: string): void {
        this.gameRooms = this.gameRooms.filter((room: GameRoom) => room.id !== roomId);
        server.to(JOINING_ROOM_ID).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private areUsersTheSame(player1: IUser, player2: IUser): boolean {
        return (
            player1.username === player2.username && player1.email === player2.email && player1.profilePicture?.name === player2.profilePicture?.name
        );
    }

    private stripUserPassword(user: IUser): IUser {
        return {
            username: user.username,
            password: 'null',
            profilePicture: user.profilePicture,
            email: user.email,
        } as IUser;
    }

    private isRoomAvailable(roomId: string): boolean {
        return !!this.getRoom(roomId)?.isAvailable;
    }

    private getRoomId(socketID: string): string {
        for (const room of this.gameRooms) {
            if (room.socketId.includes(socketID)) {
                return room.id;
            }
        }

        return '';
    }

    private getRoom(roomId: string): GameRoom | undefined {
        return this.gameRooms.find((room: GameRoom) => room.id === roomId);
    }
}
