import { GameParameters } from '@app/classes/game-parameters';
import { GameRoom } from '@app/classes/game-room';
// import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { SocketManager } from './socket-manager.service';

const UNAVAILABLE_ELEMENT_INDEX = -1;

const PLAYERS_JOINING_ROOM = 'joinGameRoom';
const SAME_USER_IN_ROOM_ERROR = "L'adversaire a le même nom";
const ROOM_NOT_AVAILABLE_ERROR = "La salle n'est plus disponible";
const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";

type Parameters = { id: string; name: string };

@Service()
export class GameSessions {
    idCounter: number;
    private gameRooms: Map<string, GameRoom>;
    private activeUsers: Map<string, string>;

    constructor(private socketManager: SocketManager) {
        this.gameRooms = new Map<string, GameRoom>();
        this.activeUsers = new Map<string, string>();
        this.idCounter = 0;
    }

    initSocketEvents() {
        this.socketManager.io('createGame', (sio, socket, gameInfo: GameParameters) => {
            //
            const roomId = this.setupNewRoom(gameInfo, socket.id);
            socket.join(roomId);
            socket.emit('gameCreatedConfirmation', roomId);
            sio.to(PLAYERS_JOINING_ROOM).emit('updateListOfRooms', this.getAvailableRooms());
        });

        this.socketManager.io('roomJoin', (sio, socket, paramaters: Parameters) => {
            const roomId = paramaters.id;
            const username = paramaters.name;

            const roomIsAvailable = this.roomStatus(roomId);
            const userNotTheSame = !this.sameUsernameExists(username, roomId);

            if (roomIsAvailable && userNotTheSame) {
                socket.leave(PLAYERS_JOINING_ROOM);
                socket.join(roomId);
                this.addUserToRoom(username, socket.id, roomId);
                socket.emit('joinValid', this.getOpponentName(username, roomId));
                socket.broadcast.to(roomId).emit('foundOpponent', username);
            } else if (!userNotTheSame) socket.emit('joiningError', SAME_USER_IN_ROOM_ERROR);
            else socket.emit('joiningError', ROOM_NOT_AVAILABLE_ERROR);

            sio.to(PLAYERS_JOINING_ROOM).emit('updateListOfRooms', this.getAvailableRooms());
        });

        this.socketManager.io('roomLobby', (sio, socket) => {
            //
            socket.join(PLAYERS_JOINING_ROOM);
            sio.to(PLAYERS_JOINING_ROOM).emit('updateListOfRooms', this.getAvailableRooms());
        });

        this.socketManager.io('removeRoom', (sio, _, roomID: string) => {
            //
            this.removeRoom(roomID);
            sio.to(PLAYERS_JOINING_ROOM).emit('updateListOfRooms', this.getAvailableRooms());
        });

        this.socketManager.on('rejectOpponent', (socket, roomId: string) => {
            //
            socket.broadcast.to(roomId).emit('rejectByOtherPlayer', PLAYERS_REJECT_FROM_ROOM_ERROR);
        });
        this.socketManager.on('joinRoom', (socket, roomID: string) => {
            //
            socket.join(roomID);
        });
        this.socketManager.io('rejectByOtherPlayer', (sio, socket, parameters: Parameters) => {
            const roomId = parameters.id;
            const playerName = parameters.name;
            socket.leave(roomId);
            socket.join(PLAYERS_JOINING_ROOM);
            this.removeUserFromRoom(playerName, socket.id, roomId);
            sio.to(PLAYERS_JOINING_ROOM).emit('updateListOfRooms', this.getAvailableRooms());
        });

        this.socketManager.io('startScrabbleGame', (sio, _, roomId: string) => {
            //
            sio.to(roomId).emit('gameAboutToStart');
        });
    }

    getNewId(): string {
        const id = this.idCounter++;
        return id.toString();
    }

    // TODO : Come back to this
    // getGameRoom(socket: Socket, roomId: string): void {
    //     const room = this.gameRooms.get(roomId);
    //     if (room !== undefined) {
    //         socket.emit('answer', room);
    //     }
    // }

    getActiveUser(): Map<string, string> {
        //
        return this.activeUsers;
    }

    getAvailableRooms(): GameRoom[] {
        //
        const roomAvailableArray: GameRoom[] = [];
        this.gameRooms.forEach((gameRoom) => {
            if (gameRoom.users.length === 1) roomAvailableArray.push(gameRoom);
        });
        return roomAvailableArray;
    }

    roomStatus(roomID: string): boolean {
        //
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) return room.isAvailable;
        return false;
    }

    setupNewRoom(parameters: GameParameters, socketId: string): string {
        //
        const roomID = this.getNewId();
        const newRoom: GameRoom = {
            id: roomID,
            users: [parameters.username],
            socketID: [socketId],
            isAvailable: true,
            dictionary: parameters.dictionary,
            timer: parameters.timer,
            mode: parameters.mode,
        };
        this.addUserToActiveUsers(parameters.username, socketId);
        this.gameRooms.set(roomID, newRoom);
        return roomID;
    }

    sameUsernameExists(user: string, roomID: string): boolean {
        //
        const room = this.gameRooms.get(roomID);
        let sameUsername = true;
        if (room !== undefined) sameUsername = room.users[0] === user;
        return sameUsername;
    }

    getOpponentName(user: string, roomID: string): string {
        //
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) {
            if (room.users[0] === user) {
                return room.users[1];
            }
            return room.users[0];
        }

        return '';
    }

    makeRoomAvailable(roomID: string): void {
        //
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) room.isAvailable = true;
    }

    makeRoomUnavailable(roomID: string): void {
        //
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) room.isAvailable = false;
    }

    addUserToRoom(user: string, socketID: string, roomID: string): void {
        //
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) {
            room.users.push(user);
            room.socketID.push(socketID);
        }
        this.addUserToActiveUsers(user, socketID);
        this.makeRoomUnavailable(roomID);
    }

    removeUserFromRoom(user: string, socketID: string, roomID: string): void {
        //
        const room = this.gameRooms.get(roomID);
        if (room !== undefined) {
            const index: number = room.users.indexOf(user);
            if (index > UNAVAILABLE_ELEMENT_INDEX) room.users.splice(index, 1);
            const index1: number = room.socketID.indexOf(socketID);
            if (index > UNAVAILABLE_ELEMENT_INDEX) room.socketID.splice(index1, 1);
        }

        this.removeUserFromActiveUsers(socketID);
        this.makeRoomAvailable(roomID);
    }

    removeRoom(roomID: string) {
        //
        this.gameRooms.delete(roomID);
    }

    addUserToActiveUsers(username: string, socketID: string) {
        //
        this.activeUsers.set(socketID, username);
    }

    removeUserFromActiveUsers(socketID: string) {
        //
        this.activeUsers.delete(socketID);
    }

    getRoomId(socketID: string) {
        for (const [key, value] of this.gameRooms.entries()) {
            if (value.socketID.includes(socketID)) return key;
        }
        return null;
    }
}
