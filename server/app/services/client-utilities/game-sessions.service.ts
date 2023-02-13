import { GameParameters } from '@app/interfaces/game-parameters';
import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';

const UNAVAILABLE_ELEMENT_INDEX = -1;
const SECOND = 1000;
const PLAYERS_JOINING_ROOM = 'joinGameRoom';
const SAME_USER_IN_ROOM_ERROR = "L'adversaire a le même nom";
const ROOM_NOT_AVAILABLE_ERROR = "La salle n'est plus disponible";
const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";

type Parameters = { id: string; name: string };

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

        this.socketManager.io(SocketEvents.PlayerJoinGameAvailable, (sio, socket, parameters: Parameters) => {
            this.playerJoinGameAvailable(sio, socket, parameters);
        });

        this.socketManager.io(SocketEvents.RoomLobby, (sio, socket) => {
            this.roomLobby(sio, socket);
        });

        this.socketManager.on(SocketEvents.ExitWaitingRoom, (socket, parameters: Parameters) => {
            this.exitWaitingRoom(socket, parameters);
        });

        this.socketManager.io(SocketEvents.RemoveRoom, (sio, _, roomID: string) => {
            this.removeRoom(sio, roomID);
        });

        this.socketManager.on(SocketEvents.RejectOpponent, (socket, roomId: string) => {
            this.rejectOpponent(socket, roomId);
        });

        this.socketManager.on(SocketEvents.JoinRoom, (socket, roomID: string) => {
            this.joinRoom(socket, roomID);
        });
        this.socketManager.io(SocketEvents.RejectByOtherPlayer, (sio, socket, parameters: Parameters) => {
            this.rejectByOtherPlayer(sio, socket, parameters);
        });

        this.socketManager.io(SocketEvents.StartScrabbleGame, (sio, socket, roomId: string) => {
            this.startScrabbleGame(sio, socket, roomId);
        });

        this.socketManager.io(SocketEvents.Disconnect, (sio, socket) => {
            this.disconnect(sio, socket);
        });
    }

    private joinRoom(this: this, socket: Socket, roomID: string): void {
        socket.join(roomID);
    }

    private rejectOpponent(this: this, socket: Socket, roomId: string): void {
        socket.broadcast.to(roomId).emit(SocketEvents.RejectByOtherPlayer, PLAYERS_REJECT_FROM_ROOM_ERROR);
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
    private playerJoinGameAvailable(this: this, sio: Server, socket: Socket, parameters: Parameters): void {
        const roomId = parameters.id;
        const username = parameters.name;

        const roomIsAvailable = this.roomStatus(roomId);
        const userTheSame = this.sameUsernameExists(username, roomId);

        if (roomIsAvailable && !userTheSame) {
            socket.leave(PLAYERS_JOINING_ROOM);
            socket.join(roomId);
            this.addUserToRoom(username, socket.id, roomId);
            socket.emit(SocketEvents.JoinValidGame, this.getOpponentName(username, roomId));
            socket.broadcast.to(roomId).emit(SocketEvents.FoundAnOpponent, username);
        } else if (userTheSame) socket.emit(SocketEvents.ErrorJoining, SAME_USER_IN_ROOM_ERROR);
        else socket.emit(SocketEvents.ErrorJoining, ROOM_NOT_AVAILABLE_ERROR);

        sio.to(PLAYERS_JOINING_ROOM).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private exitWaitingRoom(this: this, socket: Socket, parameters: Parameters): void {
        const roomId = parameters.id;
        const playerName = parameters.name;
        socket.broadcast.to(roomId).emit(SocketEvents.OpponentLeave);
        socket.leave(roomId);
        socket.join(PLAYERS_JOINING_ROOM);
        this.removeUserFromRoom(playerName, socket.id, roomId);
    }

    private rejectByOtherPlayer(this: this, sio: Server, socket: Socket, parameters: Parameters): void {
        const roomId = parameters.id;
        const playerName = parameters.name;
        socket.leave(roomId);
        socket.join(PLAYERS_JOINING_ROOM);
        this.removeUserFromRoom(playerName, socket.id, roomId);
        sio.to(PLAYERS_JOINING_ROOM).emit(SocketEvents.UpdateRoomJoinable, this.getAvailableRooms());
    }

    private startScrabbleGame(this: this, sio: Server, socket: Socket, roomId: string): void {
        const room = this.gameRooms.get(roomId);
        if (room !== undefined) sio.to(roomId).emit(SocketEvents.GameAboutToStart, room.socketID);
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

    private getAvailableRooms(): GameRoom[] {
        const roomAvailableArray: GameRoom[] = [];
        this.gameRooms.forEach((gameRoom) => {
            if (gameRoom.isAvailable === true) roomAvailableArray.push(gameRoom);
        });
        return roomAvailableArray;
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
            users: [parameters.username],
            socketID: [socketId],
            isAvailable: parameters.isMultiplayer ? true : false,
            dictionary: parameters.dictionary,
            timer: parameters.timer,
            mode: parameters.mode,
        };
        this.gameRooms.set(roomID, newRoom);
        return roomID;
    }

    private sameUsernameExists(user: string, roomID: string): boolean {
        const room = this.gameRooms.get(roomID);
        let sameUsername = true;
        if (room !== undefined) sameUsername = room.users[0] === user;
        return sameUsername;
    }

    private getOpponentName(user: string, roomID: string): string {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) {
            if (room.users[0] === user) {
                return room.users[1];
            }
            return room.users[0];
        }

        return '';
    }

    private makeRoomAvailable(roomID: string): void {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) room.isAvailable = true;
    }

    private makeRoomUnavailable(roomID: string): void {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) room.isAvailable = false;
    }

    private addUserToRoom(user: string, socketID: string, roomID: string): void {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) {
            room.users.push(user);
            room.socketID.push(socketID);
        }
        this.makeRoomUnavailable(roomID);
    }

    private removeUserFromRoom(user: string, socketID: string, roomID: string): void {
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) {
            const index: number = room.users.indexOf(user);
            if (index > UNAVAILABLE_ELEMENT_INDEX) room.users.splice(index, 1);
            const index1: number = room.socketID.indexOf(socketID);
            if (index > UNAVAILABLE_ELEMENT_INDEX) room.socketID.splice(index1, 1);
        }
        this.makeRoomAvailable(roomID);
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
}
