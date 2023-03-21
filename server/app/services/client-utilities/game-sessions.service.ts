import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { NUMBER_OF_PLAYERS } from '@common/constants/players';
import { SocketEvents } from '@common/constants/socket-events';
import { GameParameters } from '@common/interfaces/game-parameters';
import { JoinGameRoomParameters } from '@common/interfaces/join-game-room-parameters';
import { IUser } from '@common/interfaces/user';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';

const UNAVAILABLE_ELEMENT_INDEX = -1;
const SECOND = 1000;
const PLAYERS_JOINING_ROOM = 'joinGameRoom';
const SAME_USER_IN_ROOM_ERROR = "L'adversaire a le même nom";
const ROOM_NOT_AVAILABLE_ERROR = "La salle n'est plus disponible";
const WRONG_ROOM_PASSWORD = 'Le mot de passe pour la salle est erronée';
// const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";

@Service()
export class GameSessions {
    idCounter: number;
    private gameRooms: Map<string, GameRoom>;

    constructor(private socketManager: SocketManager) {
        this.gameRooms = new Map<string, GameRoom>();
        this.idCounter = 0;
    }

    initSocketEvents() {
        this.socketManager.io(SocketEvents.CreateGame, (sio, socket, gameInfo: GameParameters) => {
            this.createGame(sio, socket, gameInfo);
        });

        this.socketManager.io(SocketEvents.PlayerJoinGameAvailable, (sio, socket, roomParameters: JoinGameRoomParameters) => {
            this.playerJoinGameAvailable(sio, socket, roomParameters);
        });

        this.socketManager.io(SocketEvents.RoomLobby, (sio, socket) => {
            this.roomLobby(sio, socket);
        });

        this.socketManager.on(SocketEvents.ExitWaitingRoom, (socket, roomParameters: JoinGameRoomParameters) => {
            this.exitWaitingRoom(socket, roomParameters);
        });

        this.socketManager.io(SocketEvents.RemoveRoom, (sio, _, roomID: string) => {
            this.removeRoom(sio, roomID);
        });

        this.socketManager.on(SocketEvents.RejectOpponent, (socket, roomParameters: JoinGameRoomParameters) => {
            this.rejectOpponent(socket, roomParameters);
        });

        this.socketManager.on(SocketEvents.JoinRoom, (socket, roomID: string) => {
            this.joinRoom(socket, roomID);
        });

        this.socketManager.io(SocketEvents.RejectByOtherPlayer, (sio, socket, roomParameters: JoinGameRoomParameters) => {
            this.rejectByOtherPlayer(sio, socket, roomParameters);
        });

        this.socketManager.on(SocketEvents.Invite, (socket, inviteeId: string, parameters: JoinGameRoomParameters) => {
            this.invitePlayer(socket, inviteeId, parameters);
        });

        this.socketManager.io(SocketEvents.StartScrabbleGame, (sio, socket, roomId: string) => {
            this.startScrabbleGame(sio, roomId);
        });

        this.socketManager.io(SocketEvents.Disconnect, (sio, socket) => {
            this.disconnect(sio, socket);
        });
    }

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

    private invitePlayer(this: this, socket: Socket, inviteeId: string, parameters: JoinGameRoomParameters): void {
        socket.broadcast.to(inviteeId).emit(SocketEvents.Invite, parameters);
    }

    private joinRoom(this: this, socket: Socket, roomID: string): void {
        socket.join(roomID);
    }

    private rejectOpponent(this: this, socket: Socket, roomParameters: JoinGameRoomParameters): void {
        // Check that the player is removed from the game room player list
        socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.RejectByOtherPlayer, this.stripUserPassword(roomParameters.player));
    }

    private roomLobby(this: this, sio: Server, socket: Socket): void {
        socket.join(PLAYERS_JOINING_ROOM);
        sio.to(PLAYERS_JOINING_ROOM).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private disconnect(this: this, sio: Server, socket: Socket): void {
        let tempTime = 5;
        setInterval(() => {
            tempTime = tempTime - 1;
            if (tempTime === 0) {
                const roomId = this.getRoomId(socket.id);
                if (roomId !== null) {
                    this.removeRoom(sio, roomId);
                }
            }
        }, SECOND);
    }

    private playerJoinGameAvailable(this: this, sio: Server, socket: Socket, roomParameters: JoinGameRoomParameters): void {
        const userAlreadyConnected: boolean = this.sameUserConnected(roomParameters.player, roomParameters.roomId);

        if (
            this.roomStatus(roomParameters.roomId) &&
            !userAlreadyConnected &&
            this.verifyRoomPassword(roomParameters.password, roomParameters.roomId)
        ) {
            socket.leave(PLAYERS_JOINING_ROOM);
            socket.join(roomParameters.roomId);

            this.addUserToRoom(socket.id, roomParameters);

            socket.emit(SocketEvents.JoinValidGame, this.getPlayers(roomParameters.roomId));
            socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.FoundAnOpponent, this.stripUserPassword(roomParameters.player));
        } else if (userAlreadyConnected) {
            socket.emit(SocketEvents.ErrorJoining, SAME_USER_IN_ROOM_ERROR);
        } else if (!this.verifyRoomPassword(roomParameters.password, roomParameters.roomId)) {
            socket.emit(SocketEvents.ErrorJoining, WRONG_ROOM_PASSWORD);
        } else {
            socket.emit(SocketEvents.ErrorJoining, ROOM_NOT_AVAILABLE_ERROR);
        }
        sio.to(PLAYERS_JOINING_ROOM).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private exitWaitingRoom(this: this, socket: Socket, roomParameters: JoinGameRoomParameters): void {
        if (!roomParameters.roomId) return;

        socket.broadcast.to(roomParameters.roomId).emit(SocketEvents.OpponentLeave, this.stripUserPassword(roomParameters.player));
        socket.leave(roomParameters.roomId);
        socket.join(PLAYERS_JOINING_ROOM);
        this.removeUserFromRoom(socket.id, roomParameters);
    }

    private rejectByOtherPlayer(this: this, sio: Server, socket: Socket, roomParameters: JoinGameRoomParameters): void {
        socket.leave(roomParameters.roomId);
        socket.join(PLAYERS_JOINING_ROOM);

        this.removeUserFromRoom(socket.id, roomParameters);
        sio.to(PLAYERS_JOINING_ROOM).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private startScrabbleGame(this: this, sio: Server, roomId: string): void {
        const room = this.gameRooms.get(roomId);
        if (room) {
            sio.to(roomId).emit(SocketEvents.GameAboutToStart, room.socketID);
        }
    }

    private createGame(this: this, sio: Server, socket: Socket, gameInfo: GameParameters): void {
        const roomId = this.setupNewRoom(gameInfo, socket.id);
        socket.join(roomId);
        socket.emit(SocketEvents.GameCreatedConfirmation, roomId);
        sio.to(PLAYERS_JOINING_ROOM).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private getNewId(): string {
        return uuid.v4().substring(0, 6);
    }

    private verifyRoomPassword(password: string | undefined, roomId: string): boolean {
        if (!password) return true;

        const room = this.gameRooms.get(roomId);
        if (room === undefined) return false;

        return room.password === password;
    }

    private roomStatus(roomID: string): boolean {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) return room.isAvailable;
        return false;
    }

    private setupNewRoom(parameters: GameParameters, socketId: string): string {
        const roomID = this.getNewId();
        const newRoom: GameRoom = {
            id: roomID,
            users: [parameters.user],
            socketID: [socketId],
            isAvailable: parameters.isMultiplayer,
            dictionary: parameters.dictionary,
            timer: parameters.timer,
            mode: parameters.mode,
            visibility: parameters.visibility,
            password: parameters.password?.length ? parameters.password : '',
        };
        this.gameRooms.set(roomID, newRoom);
        return roomID;
    }

    private sameUserConnected(user: IUser, roomID: string): boolean {
        const room = this.gameRooms.get(roomID);
        let alreadyConnected = false;
        room?.users.forEach((connectedUser: IUser) => {
            if (this.areUsersTheSame(user, connectedUser)) {
                alreadyConnected = true;
            }
        });
        return alreadyConnected;
    }

    private getPlayers(roomID: string): IUser[] {
        const room = this.gameRooms.get(roomID);
        const players: IUser[] = [];

        if (room) {
            room.users.forEach((opponent: IUser) => {
                players.push(this.stripUserPassword(opponent));
            });
        }

        return players;
    }

    private makeRoomAvailable(roomID: string): void {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined && room.socketID.length !== NUMBER_OF_PLAYERS) room.isAvailable = true;
    }

    private makeRoomUnavailable(roomID: string): void {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined && room.socketID.length === NUMBER_OF_PLAYERS) room.isAvailable = false;
    }

    private addUserToRoom(socketID: string, roomParameters: JoinGameRoomParameters): void {
        const room = this.gameRooms.get(roomParameters.roomId);
        if (room !== undefined) {
            room.users.push(roomParameters.player);
            room.socketID.push(socketID);
        }

        this.makeRoomUnavailable(roomParameters.roomId);
    }

    private removeUserFromRoom(socketID: string, roomParameters: JoinGameRoomParameters): void {
        const room = this.gameRooms.get(roomParameters.roomId);
        if (room !== undefined) {
            const index: number = room.users.findIndex((user: IUser) => {
                return this.areUsersTheSame(user, roomParameters.player);
            });

            if (index > UNAVAILABLE_ELEMENT_INDEX) {
                room.users.splice(index, 1);
                room.socketID.splice(room.socketID.indexOf(socketID), 1);
            }
        }
        this.makeRoomAvailable(roomParameters.roomId);
    }

    private removeRoom(this: this, sio: Server, roomID: string): void {
        this.gameRooms.delete(roomID);
        sio.to(PLAYERS_JOINING_ROOM).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private getRoomId(socketID: string) {
        for (const [key, value] of this.gameRooms.entries()) {
            if (value.socketID.includes(socketID)) return key;
        }
        return null;
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
}
