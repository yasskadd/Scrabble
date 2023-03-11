export enum BoardTileType {
    Empty = 'empty',
    Center = 'center',
    DoubleLetter = 'double_letter',
    DoubleWord = 'double_word',
    TripleLetter = 'triple_letter',
    TripleWord = 'triple_word',
}

export enum BoardTileState {
    Empty = 'empty',
    Temp = 'temp',
    Pending = 'pending',
    Confirmed = 'confirmed',
}
