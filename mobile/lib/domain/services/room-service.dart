import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:mobile/domain/enums/socket-events-enum.dart';
import 'package:mobile/domain/models/iuser-model.dart';
import 'package:mobile/domain/models/joingameparams-model.dart';
import 'package:mobile/domain/models/userimageinfo-model.dart';
import 'package:mobile/domain/services/auth-service.dart';
import 'package:mobile/domain/services/game-service.dart';
import 'package:mobile/screens/game-screen.dart';
import 'package:rxdart/subjects.dart';
import 'package:socket_io_client/socket_io_client.dart';
import 'package:mobile/domain/models/room-model.dart';
import 'package:mobile/domain/enums/socket-events-enum.dart';

class RoomService {
  // FOR TESTING
  final Socket _socket = GetIt.I.get<Socket>();
  final AuthService _authService = GetIt.I.get<AuthService>();

  List<GameRoom> roomList = [];
  GameRoom? currentRoom;
  Subject<List<GameRoom>> notifyNewRoomList = PublishSubject();
  Subject<GameRoom?> notifyRoomMemberList = PublishSubject();
  Subject<GameRoom?> notifyRoomJoin = PublishSubject();

  RoomService() {
    initSocketListeners();
  }

  void connectToRooms() {
    _socket.emit(RoomSocketEvent.EnterRoomLobby.event);
  }

  void initSocketListeners() {
    _socket.on(RoomSocketEvent.UpdateGameRooms.event, (data) {
      final newRooms =
          (data as List<dynamic>).map((e) => GameRoom.fromJson(e)).toList();
      _updateRoomList(newRooms);
    });

    _socket.on(RoomSocketEvent.JoinedValidWaitingRoom.event, (data) {
      final gameRoom = GameRoom.fromJson(data);
      debugPrint("Join Room request accepted");
      _joinRoom(gameRoom);
    });

    _socket.on(RoomSocketEvent.UpdateWaitingRoom.event, (data) {
      currentRoom = GameRoom.fromJson(data);
      notifyRoomMemberList.add(currentRoom);
    });

    _socket.on(RoomSocketEvent.KickedFromWaitingRoom.event, (_) {
      currentRoom = null;
      notifyRoomMemberList.add(currentRoom);
    });

    _socket.on(RoomSocketEvent.GameAboutToStart.event, (_) {
      GetIt.I.get<GameService>().inGame = true;
      Navigator.pushReplacement(
          GetIt.I.get<GlobalKey<NavigatorState>>().currentContext!,
          MaterialPageRoute(builder: (context) => const GameScreen()));
    });
  }

  void _updateRoomList(List<GameRoom> newRooms) {
    roomList = newRooms;
    notifyNewRoomList.add(newRooms);
  }

  void requestJoinRoom(GameRoom room) {
    currentRoom = room;

    final player = RoomPlayer(_authService.user!, room.id);
    _socket.emit(RoomSocketEvent.JoinWaitingRoom.event, player);
  }

  void _joinRoom(GameRoom newRoom) {
    currentRoom = newRoom;
    notifyRoomJoin.add(currentRoom!);
    debugPrint("Room Joined");
  }

  void createRoom(GameCreationQuery creationQuery) {
    _socket.emit(RoomSocketEvent.CreateWaitingRoom.event, creationQuery);

    // Temporary until UpdateWaitingRoom is called
    currentRoom = GameRoom(
        id: "-",
        players: [
          RoomPlayer(creationQuery.user, "-", playerType: PlayerType.User, isCreator: true)
        ],
        dictionary: creationQuery.dictionary,
        timer: creationQuery.timer,
        gameMode: creationQuery.gameMode,
        visibility: creationQuery.visibility);
  }

  void exitRoom() {
    UserRoomQuery exitQuery =
        UserRoomQuery(user: _authService.user!, roomId: currentRoom!.id);
    _socket.emit(RoomSocketEvent.ExitWaitingRoom.event, exitQuery);
  }

  void startScrabbleGame() {
    GetIt.I.get<GameService>(); // Init Game Service
    _socket.emit(RoomSocketEvent.StartScrabbleGame.event, currentRoom!.id);
  }
}
