export enum SocketEvents {
    SendMessage = 'sendMessage',
    ReceiveHomeMessage = 'broadcastMessageHome',
    JoinHomeRoom = 'joinHomeRoom',
    UserJoinedRoom = 'userJoinedRoom',
    UserConnected = 'userConnected',
    SendHomeMessage = 'sendHomeMessage',
    UserLeftRoom = 'leaveHomeRoom',
    RoomIsFull = 'roomIsFull',
    UsernameTaken = 'usernameTaken',
    UserLeftHomeRoom = 'userLeftHomeRoom',
    Disconnect = 'disconnect',
    SignIn = 'signIn',
    SignOut = 'signOut',

    GameMessage = 'gameMessage',
    GameCommand = 'command',
    OpponentDisconnect = 'user disconnect',
    PublicViewUpdate = 'updateClientView',
    UpdateGameBoard = 'updateGameBoard',
    Play = 'playGame',
    Exchange = 'ExchangeLetters',
    CreateGame = 'createGame',
    CurrentGameRoomUpdate = 'gameCreatedConfirmation',
    UpdateGameRooms = 'updateListOfRooms',
    JoinGameRoom = 'roomJoin',
    JoinedValidGame = 'joinValid',
    FoundAnOpponent = 'foundOpponent',
    ErrorJoining = 'joiningError',
    EnterRoomLobby = 'roomLobby',
    RemoveRoom = 'removeRoom',
    RejectOpponent = 'rejectOpponent',
    KickedFromGameRoom = 'kickedFromGameRoom',
    ExitGameRoom = 'exitGameRoom',
    StartScrabbleGame = 'startScrabbleGame',
    GameAboutToStart = 'gameAboutToStart',
    ExitWaitingRoom = 'exitWaitingRoom',
    OpponentLeave = 'opponentLeave',
    RackViewUpdate = 'updateRackClient',
    Skip = 'skip',
    UpdatePlayerInformation = 'UpdateMyPlayerInformation',
    UpdateOpponentInformation = 'UpdateOpponentInformation',
    CreateScrabbleGame = 'createScrabbleGame',
    TimerClientUpdate = 'timerUpdate',
    OpponentGameLeave = 'OpponentLeftTheGame',
    GameEnd = 'endGame',
    AbandonGame = 'AbandonGame',
    LetterReserveUpdated = 'letterReserveUpdated',
    ImpossibleCommandError = 'impossibleCommandError',
    UserDisconnect = 'user disconnect',
    QuitGame = 'quitGame',
    ReserveCommand = 'reserveCommand',
    AllReserveLetters = 'allReserveLetters',
    ClueCommand = 'clueCommand',
    ImportDictionary = 'ImportDictionary',
    SendMessageHome = 'sendMessageHome',
    Invite = 'invite',
}
