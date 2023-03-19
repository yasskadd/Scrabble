import { GameParameters } from '@app/interfaces/game-parameters';
import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { PlayerRoomInfo } from '@common/interfaces/player-room-info';
import { IUser } from '@common/interfaces/user';

const UNAVAILABLE_ELEMENT_INDEX = -1;
const SECOND = 1000;
const PLAYERS_JOINING_ROOM = 'joinGameRoom';
const SAME_USER_IN_ROOM_ERROR = "L'adversaire a le même nom";
const ROOM_NOT_AVAILABLE_ERROR = "La salle n'est plus disponible";

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

        this.socketManager.io(SocketEvents.PlayerJoinGameAvailable, (sio, socket, playerRoomInfo: PlayerRoomInfo) => {
            this.playerJoinGameAvailable(sio, socket, playerRoomInfo);
        });

        this.socketManager.io(SocketEvents.RoomLobby, (sio, socket) => {
            this.roomLobby(sio, socket);
        });

        this.socketManager.on(SocketEvents.ExitWaitingRoom, (socket, playerRoomInfo: PlayerRoomInfo) => {
            this.exitWaitingRoom(socket, playerRoomInfo);
        });

        this.socketManager.io(SocketEvents.RemoveRoom, (sio, _, roomID: string) => {
            this.removeRoom(sio, roomID);
        });

        this.socketManager.on(SocketEvents.RejectOpponent, (socket, playerRoomInfo: PlayerRoomInfo) => {
            this.rejectOpponent(socket, playerRoomInfo);
        });

        this.socketManager.on(SocketEvents.JoinRoom, (socket, roomID: string) => {
            this.joinRoom(socket, roomID);
        });
        this.socketManager.io(SocketEvents.RejectByOtherPlayer, (sio, socket, playerRoomInfo: PlayerRoomInfo) => {
            this.rejectByOtherPlayer(sio, socket, playerRoomInfo);
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

    private joinRoom(this: this, socket: Socket, roomID: string): void {
        socket.join(roomID);
    }

    private rejectOpponent(this: this, socket: Socket, playerRoomInfo: PlayerRoomInfo): void {
        socket.broadcast.to(playerRoomInfo.roomId).emit(SocketEvents.RejectByOtherPlayer, this.stripUserPassword(playerRoomInfo.player));
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

    private playerJoinGameAvailable(this: this, sio: Server, socket: Socket, playerRoomInfo: PlayerRoomInfo): void {
        const userAlreadyConnected: boolean = this.sameUserConnected(playerRoomInfo.player, playerRoomInfo.roomId);

        if (this.roomStatus(playerRoomInfo.roomId) && !userAlreadyConnected) {
            socket.leave(PLAYERS_JOINING_ROOM);
            socket.join(playerRoomInfo.roomId);

            this.addUserToRoom(socket.id, playerRoomInfo);

            socket.emit(SocketEvents.JoinValidGame, this.getPlayers(playerRoomInfo.roomId));
            socket.broadcast.to(playerRoomInfo.roomId).emit(SocketEvents.FoundAnOpponent, this.stripUserPassword(playerRoomInfo.player));
        } else if (userAlreadyConnected) {
            socket.emit(SocketEvents.ErrorJoining, SAME_USER_IN_ROOM_ERROR);
        } else {
            socket.emit(SocketEvents.ErrorJoining, ROOM_NOT_AVAILABLE_ERROR);
        }

        sio.to(PLAYERS_JOINING_ROOM).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private exitWaitingRoom(this: this, socket: Socket, playerRoomInfo: PlayerRoomInfo): void {
        if (!playerRoomInfo.roomId) return;

        socket.broadcast.to(playerRoomInfo.roomId).emit(SocketEvents.OpponentLeave, this.stripUserPassword(playerRoomInfo.player));
        socket.leave(playerRoomInfo.roomId);
        socket.join(PLAYERS_JOINING_ROOM);
        this.removeUserFromRoom(socket.id, playerRoomInfo);
    }

    private rejectByOtherPlayer(this: this, sio: Server, socket: Socket, playerRoomInfo: PlayerRoomInfo): void {
        socket.leave(playerRoomInfo.roomId);
        socket.join(PLAYERS_JOINING_ROOM);
        this.removeUserFromRoom(socket.id, playerRoomInfo);
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
        const id = this.idCounter++;
        return id.toString();
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
        if (room !== undefined) room.isAvailable = true;
    }

    private makeRoomUnavailable(roomID: string): void {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) room.isAvailable = false;
    }

    private addUserToRoom(socketID: string, playerRoomInfo: PlayerRoomInfo): void {
        const room = this.gameRooms.get(playerRoomInfo.roomId);
        if (room !== undefined) {
            room.users.push(playerRoomInfo.player);
            room.socketID.push(socketID);
        }

        this.makeRoomUnavailable(playerRoomInfo.roomId);
    }

    private removeUserFromRoom(socketID: string, playerRoomInfo: PlayerRoomInfo): void {
        const room = this.gameRooms.get(playerRoomInfo.roomId);
        if (room !== undefined) {
            const index: number = room.users.findIndex((user: IUser) => {
                return this.areUsersTheSame(user, playerRoomInfo.player);
            });

            if (index > UNAVAILABLE_ELEMENT_INDEX) {
                room.users.splice(index, 1);
                room.socketID.splice(room.socketID.indexOf(socketID), 1);
            }
        }
        this.makeRoomAvailable(playerRoomInfo.roomId);
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
