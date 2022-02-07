// Temporary place
interface Letter {
    letter: string;
    quantity: number;
    weight: number;
}

export class Player {
    rack: Letter[] = [];
    score: number = 0;
    name: string;
    room: string;
    // private objs[] : Objectif;

    constructor(name: string) {
        this.name = name;
    }
}
