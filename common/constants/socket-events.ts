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
    GameCreatedConfirmation = 'gameCreatedConfirmation',
    UpdateRoomJoinable = 'updateListOfRooms',
    JoinGameRoom = 'roomJoin',
    JoinValidGame = 'joinValid',
    FoundAnOpponent = 'foundOpponent',
    ErrorJoining = 'joiningError',
    RoomLobby = 'roomLobby',
    RemoveRoom = 'removeRoom',
    RejectOpponent = 'rejectOpponent',
    RejectByOtherPlayer = 'rejectByOtherPlayer',
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
